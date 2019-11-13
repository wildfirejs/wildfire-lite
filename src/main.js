import { initDB, initWF } from "./init";
import { butler, DEFAULT } from "./common";
import dateFns from "./modules/date-fns";
import { initI18next, resetI18next } from "./modules/i18next";
import { b64EncodeUnicode, defaultPageURL } from "./utils";
import { PCM, PHM, PTM, PTM4Meta } from "./plugin";

export const install = (
  Vue,
  {
    databaseConfig,

    pageTitle = document.title,
    pageURLMode = DEFAULT.PAGE_URL_MODE,
    pageURL = defaultPageURL(pageURLMode),

    theme = DEFAULT.THEME,
    locale = DEFAULT.LOCALE,
    defaultAvatarURL = DEFAULT.AVATAR_URL,
  },
) => {
  butler.config = {
    databaseConfig,
    pageTitle,
    pageURL: b64EncodeUnicode(pageURL),
    pageURLMode,
    locale,
    theme,
    defaultAvatarURL,
    anonymousUserId: DEFAULT.ANONYMOUS_USER_ID,
  };

  initI18next(locale);

  const { formatDate, distanceInWordsToNow } = dateFns(locale);
  butler.formatDate = formatDate;
  butler.distanceInWordsToNow = distanceInWordsToNow;

  initDB(Vue, databaseConfig);

  initWF(Vue);
};

export const reset = (Vue, config = {}) => {
  PCM.reset();
  PHM.reset();
  PTM.reset();
  PTM4Meta.reset();

  const {
    databaseConfig = butler.config.databaseConfig,

    pageTitle = document.title,
    pageURLMode = butler.config.pageURLMode,
    pageURL = defaultPageURL(pageURLMode),

    theme = butler.config.theme,
    locale = butler.config.locale,
    defaultAvatarURL = butler.config.defaultAvatarURL,
  } = config;

  butler.config = {
    databaseConfig,
    pageTitle,
    pageURL: b64EncodeUnicode(pageURL),
    pageURLMode,
    locale,
    theme,
    defaultAvatarURL,
    anonymousUserId: DEFAULT.ANONYMOUS_USER_ID,
  };

  resetI18next(locale);

  const { formatDate, distanceInWordsToNow } = dateFns(locale);
  butler.formatDate = formatDate;
  butler.distanceInWordsToNow = distanceInWordsToNow;

  initDB(Vue, databaseConfig, true);
};

export default { install, reset };
