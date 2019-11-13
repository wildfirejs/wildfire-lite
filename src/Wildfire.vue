<template>
  <div :class="classes">
    <component
      v-for="(cpntName, idx) in pluginComponents.header.before"
      :is="cpntName"
      :key="cpntName+idx"
      v-bind="pluginProps(cpntName)"/>
    <wf-header :comments-loading-state="commentsLoadingState"/>
    <component
      v-for="(cpntName, idx) in pluginComponents.header.after"
      :is="cpntName"
      :key="cpntName+idx"
      v-bind="pluginProps(cpntName)"/>
    <wf-body
      :page-comments-count="pageCommentsCount"
      :comments="commentsWithId"
      :comments-loading-state="commentsLoadingState"/>
    <component
      v-for="(cpntName, idx) in pluginComponents.footer.before"
      :is="cpntName"
      :key="cpntName+idx"
      v-bind="pluginProps(cpntName)"/>
    <wf-footer/>
  </div>
</template>

<script>
import Vue from "vue";
import elementResizeDetectorMaker from "element-resize-detector";
import WfHeader from "./layout/WfHeader";
import WfBody from "./layout/WfBody";
import WfFooter from "./layout/WfFooter";
import { bus, butler, PLUGIN_LIST_CDN } from "./common";
import { injectPlugin, ejectPlugin, PCM, PHM, pluginProps } from "./plugin";
import { getKey } from "./utils";

export default {
  name: "wildfire",
  components: {
    WfHeader,
    WfBody,
    WfFooter,
  },
  data() {
    return {
      commentsLoadingState: "prepare",
      pageCommentsCount: 0,
      pageComments: [],
      comments: [],
      banData: [],
      banList: [],
    };
  },
  computed: {
    pluginComponents: () => ({
      header: {
        before: PCM.get("header.before"),
        after: PCM.get("header.after"),
      },
      footer: {
        before: PCM.get("footer.before"),
      },
    }),
    pluginProps: () => pluginProps,
    classes() {
      return ["wf", `wf-theme-${butler.config.theme}`];
    },
    commentsWithId() {
      return this.comments
        .map((comment) => Object.assign({ replies: {} }, comment, { commentId: comment[".key"] }))
        .reverse(); // reverse the list to get descending comments
    },
  },
  created() {
    this.getUserIp();
    this.observeCommentsFromDatabase();
    this.observePluginCenter();
    this.observeCurrentUserInfoChange();
  },
  mounted() {
    this.hideLoadingModal();
    this.observeWindowWidth();
  },
  methods: {
    hideLoadingModal() {
      const wfLoadingModalEle = document.getElementById("wf-loading-modal");
      if (wfLoadingModalEle) {
        wfLoadingModalEle.style.display = "none";
      }
    },
    observeWindowWidth() {
      bus.windowWidth = this.$el.offsetWidth;
      this.observer = elementResizeDetectorMaker();
      this.observer.listenTo(this.$el, () => {
        bus.windowWidth = this.$el.offsetWidth;
      });
    },
    getUserIp() {
      Vue.http
        .get("https://api.userinfo.io/userinfos")
        .then((response) => {
          bus.info = Object.assign({}, bus.info, { ip: response.data.ip_address });
          // this.checkBanState();
          return response.data;
        })
        .catch((error) => {
          console.error(error);
          bus.info = Object.assign({}, bus.info, { ip: "unknown" });
        });
    },
    /**
     * ↓This keeps the comments up to realtime. It also
     *  watches `commentsCount` node in order to get the
     *  correct discussion count.
     */
    observeCommentsFromDatabase() {
      this.commentsLoadingState = "loading";
      const { pageURL } = butler.config;

      this.$bindAsArray(
        "comments",
        butler.db
          .ref("comments")
          .orderByChild("pageURL")
          .equalTo(pageURL),
        () => {
          this.commentsLoadingState = "failed";
          this.pageCommentsCount = 0;
          bus.discussionCount = 0;
        },
        () => {
          this.commentsLoadingState = "finished";
        },
      );
    },
    observePluginCenter() {
      Vue.http
        .get(PLUGIN_LIST_CDN)
        .then(({ data: pluginList }) => {
          butler.db
            .ref("addedPluginsFromCenter")
            .orderByValue()
            .equalTo(true)
            .on("child_added", (snapshot) => {
              const pluginId = getKey(snapshot);
              const script = document.createElement("script");
              script.src = pluginList[pluginId];
              script.onload = () => {
                injectPlugin(pluginId);
              };
              script.onerror = (error) => {
                console.error(error);
                this.$Message.error(butler.i18next.t("Wildfire.error.loading_plugin"));
              };
              document.head.appendChild(script);
            });
        })
        .catch((error) => {
          console.error(error);
          this.$Message.error(this.t("Wildfire.error.loading_plugin_list"));
        });
      butler.db.ref("addedPluginsFromCenter").on("child_changed", (snapshot) => {
        const pluginId = getKey(snapshot);
        if (!snapshot.val()) ejectPlugin(pluginId);
      });
      butler.db.ref("addedPluginsFromCenter").on("child_removed", (snapshot) => {
        const pluginId = getKey(snapshot);
        ejectPlugin(pluginId);
      });
      butler.db.ref("addedPluginOrder").on("value", (snapshot) => {
        const order = snapshot.val() || {};
        Object.keys(order).forEach((place) => {
          this.$set(PCM.order, place.replace("-", "."), order[place]);
        });
      });
    },
    /**
     * ↓This observer watches user profile updates
     *  and change accordingly. The change here will
     *  affect all child components.
     */
    observeCurrentUserInfoChange() {
      bus.$on("CurrentUserInfoUpdated", (updates) => {
        bus.user = Object.assign({}, bus.user, {
          displayName: updates["/displayName"],
          photoURL: updates["/photoURL"],
        });
      });
    },
  },
};
</script>
