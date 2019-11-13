import VueResource from "vue-resource";
import initLocalComponents from "./init-local-components";
import iView from "../modules/iview";
import Wildfire from "../Wildfire";
import "../assets/style.css";
import "../assets/style.dark.css";
import "../assets/animation.css";

export default (Vue) => {
  initLocalComponents(Vue);

  if (!Vue.http) {
    Vue.use(VueResource);
  }

  Vue.use(iView);

  Vue.component("wildfire", Wildfire);
};
