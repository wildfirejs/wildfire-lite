import firebase from "firebase";
import VueFire from "vuefire";
import { butler } from "./common";

export default (Vue, databaseConfig, isReset) => {
  Vue.use(VueFire);
  if (isReset) {
    const appName = `wildfire-${databaseConfig.projectId}`;
    butler.dbApp =
      firebase.apps.find((app) => app.name === appName) ||
      firebase.initializeApp(databaseConfig, appName);
  } else {
    butler.dbApp = firebase.initializeApp(databaseConfig, `wildfire-${databaseConfig.projectId}`);
  }
  butler.db = butler.dbApp.database();
  butler.auth = butler.dbApp.auth();
  butler.authService = firebase.auth.EmailAuthProvider.credential;
};
