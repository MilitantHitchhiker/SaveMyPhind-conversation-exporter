import {handleModalDisplay} from "./interface/uiEnhancer/modals/actions/displayCtaModals";
import {setLoadListener} from "./window/setLoadListener";
import {detectPageLoad} from "./detectPageLoad";
import {launchScrapping} from "./export/scraper/scrapPage";
import {EXPORT_DOMAINS, LOAD_DOMAINS} from "../../data/allowedDomains.json";
import {domainChecker} from "../shared/checker/domainChecker";
import {getHostAndPath} from "./utils/getters";
import {getStorageData} from "../shared/utils/chromeStorage";
import {safeExecute} from "../shared/utils/jsShorteners";

/**
 * @description - Main function to handle action on the tab
 */
async function tab() {
  const isInjecting = await getStorageData('isInjecting', 'local')
    .catch(() => false);

  isInjecting
    ? await actionExtensionIconClicked()
    : await actionPageLoaded();

  await chrome.storage.local.set({isInjecting: false});
}

/**
 * @description - Action to execute when the page is loaded
 */
export async function actionPageLoaded() {
  const domain = domainChecker(LOAD_DOMAINS, getHostAndPath());
  if (domain === null) return;
  const htmlCheck = detectPageLoad(domain);
  if (!htmlCheck) return;
  // scrapOnLoadListener();
  await setLoadListener(domain);
}

/**
 * @description - Action to execute when the extension icon is clicked
 */
export async function actionExtensionIconClicked() {
  const domainPage = domainChecker(EXPORT_DOMAINS, getHostAndPath());
  if (domainPage === null) return;
  launchScrapping(domainPage); // don't safeExecute because we don't want handleModalDisplay to increment count
  await safeExecute(handleModalDisplay());
}

// Launch the main content script
tab();
