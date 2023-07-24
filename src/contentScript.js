import {launchExport} from "./activeTab/orchestrator";
import {sleep} from "./activeTab/utils/utils";
import {logWaitElts} from "./activeTab/console/consoleMessages";
import {clickOnListElt} from "./activeTab/interact/interact";
import {fetchInfos} from "./activeTab/extractor/getters";

let appInfos = null;
fetchInfos().then(res => appInfos = res);

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  if (request.message === 'executeScript') {
    if (request.index > 0) launchExport();
    clickOnListElt(request.index)
    setTimeout(function () {
      sendResponse({message: 'scriptExecuted'});
    }, 1);
  }
  return true; // will respond asynchronously
});

window.addEventListener('load', function() {
  if (window.location.href.includes("phind.com"))
  {
    chrome.runtime.sendMessage({message: 'LOAD_COMPLETE'}, function(response) {
      if (response.message === 'exportAllThreads finished')
        window.location.href = "https://www.phind.com";
      else
      if (response.message === 'LOAD_COMPLETE processed' || response.message === 'exportAllThreads in progress') {
        // Create elements to add to the page
        let exportAllThreadsSideBtn = createSideMenuBtn('Export All Threads', 'fe-share');
        let stopExportAllThreadsSideBtn = createSideMenuBtn('Stop Exporting Threads', 'fe-x', 'none');

        let exportAllThreadsTopBtn = createTopBtn('Export All Threads', 'fe-share');
        let stopExportAllThreadsTopBtn = createTopBtn('Stop Exporting Threads', 'fe-x');
        let exportThreadTopBtn = createTopBtn('Save This Thread', 'fe-save');

        // Events on buttons
        exportThreadTopBtn.addEventListener('click', function() {
          launchExport();
        });

        exportAllThreadsSideBtn.addEventListener('click', function() {
          let redirect = false;
          if (window.location.href !== "https://www.phind.com/" && window.location.href !== "https://www.phind.com")
          {
            window.location.href = "https://www.phind.com";
            redirect = true;
          }
          chrome.runtime.sendMessage({message: 'exportAllThreads', length: document.querySelectorAll(".table-responsive tr").length}, function(response) {
            console.log(response.message);
          });
          setBtnsExport(true, exportAllThreadsSideBtn, exportAllThreadsTopBtn, stopExportAllThreadsSideBtn, stopExportAllThreadsTopBtn);
        });

        stopExportAllThreadsSideBtn.addEventListener('click', function() {
          chrome.runtime.sendMessage({message: 'stopExportingThreads'}, function(response) {
            console.log(response.message);
          });
          setBtnsExport(false, exportAllThreadsSideBtn, exportAllThreadsTopBtn, stopExportAllThreadsSideBtn, stopExportAllThreadsTopBtn);
          window.location.href = "https://www.phind.com";
        });

        exportAllThreadsTopBtn.addEventListener('click', function() {
          let redirect = false;
          if (window.location.href !== "https://www.phind.com/" && window.location.href !== "https://www.phind.com")
          {
            window.location.href = "https://www.phind.com";
            redirect = true;
          }

          chrome.runtime.sendMessage({message: 'exportAllThreads', length: document.querySelectorAll(".table-responsive tr").length, redirect: redirect}, function(response) {
            console.log(response.message);
          });
          setBtnsExport(true, exportAllThreadsSideBtn, exportAllThreadsTopBtn, stopExportAllThreadsSideBtn, stopExportAllThreadsTopBtn);
        });

        stopExportAllThreadsTopBtn.addEventListener('click', function() {
          chrome.runtime.sendMessage({message: 'stopExportingThreads'}, function(response) {
            console.log(response.message);
          });
          setBtnsExport(false, exportAllThreadsSideBtn, exportAllThreadsTopBtn, stopExportAllThreadsSideBtn, stopExportAllThreadsTopBtn);
          window.location.href = "https://www.phind.com";
        });


        // Show/hide buttons
        if (response.message === 'exportAllThreads in progress') {
          setBtnsExport(true, exportAllThreadsSideBtn, exportAllThreadsTopBtn, stopExportAllThreadsSideBtn, stopExportAllThreadsTopBtn)
        }
        else
        {
          setBtnsExport(false, exportAllThreadsSideBtn, exportAllThreadsTopBtn, stopExportAllThreadsSideBtn, stopExportAllThreadsTopBtn)
        }

        // Append buttons
        waitAppend(".col-lg-2 > div > div > table", [exportAllThreadsSideBtn, stopExportAllThreadsSideBtn], 'appendChild');

        waitAppend(":not(.row.justify-content-center) > div > .container-xl", [exportThreadTopBtn], 'prepend')

        let doublePlace = [
          {
            selector: ".row.justify-content-center > div > .container-xl",
            mode: 'append'
          },
          {
            selector: ":not(.row.justify-content-center) > div > .container-xl",
            mode: 'prepend'
          }
        ];
        waitAppend(doublePlace, [exportAllThreadsTopBtn, stopExportAllThreadsTopBtn]);

        chrome.storage.sync.get(['displayModalUpdate'], function (result) {
          if (result.displayModalUpdate) {
            // Create modal
            let modalbg = createModalBg()
            let modalUpdateLogs = createModalUpdate(modalbg);

            // Append modal
            waitAppend("body", [modalbg, modalUpdateLogs], 'appendChild');

            // Update storage
            chrome.storage.sync.set({displayModalUpdate: false}, function () {
              console.log("Last update modal will not be displayed anymore");
            });
          }
        });
      }
    });
  }
});

function setBtnsExport(exporting, exportAllThreadsSideBtn, exportAllThreadsTopBtn, stopExportAllThreadsSideBtn, stopExportAllThreadsTopBtn) {
  if (exporting) {
    exportAllThreadsSideBtn.style.display = 'none';
    exportAllThreadsTopBtn.style.display = 'none';
    stopExportAllThreadsSideBtn.style.display = 'block';
    stopExportAllThreadsTopBtn.style.display = 'inline-block';
  }
  else
  {
    exportAllThreadsSideBtn.style.display = 'block';
    exportAllThreadsTopBtn.style.display = 'inline-block';
    stopExportAllThreadsSideBtn.style.display = 'none';
    stopExportAllThreadsTopBtn.style.display = 'none';
  }
}

async function waitAppend(select, htmlTableSectionElements, mode= 'append') {
  let nester = null;
  if (typeof select === 'string') {
    nester = document.querySelector(select);
    while (nester === null) {
      // logWaitElts();
      await sleep(1000)
      nester = document.querySelector(select);
    }
  }
  else if (typeof select === 'object') {
    let added = false;
    let res = select.filter(elt => document.querySelector(elt.selector))
    while (res === []) {
      await sleep(1000)
      res = select.filter(selector => document.querySelector(selector))
    }
    mode = res[0].mode;
    nester = document.querySelector(res[0].selector);
  }
  else return false;

  if (mode === 'prepend') {
    for (let button of htmlTableSectionElements) {
      nester.prepend(button);
    }
  }
  else if (mode === 'appendChild')
  {
    for (let button of htmlTableSectionElements) {
      nester.appendChild(button);
    }
  }
  else
  {
    for (let button of htmlTableSectionElements) {
      nester.append(button);
    }
  }
  return true;
}


/*
--- ELTS CREATION ---
 */
function createSideMenuBtn(title, icon, display = 'block') {
// Step 2: Create the tbody element.
  var button = document.createElement('tbody');

// Step 3: Create the tr element and set its style.
  var tr = document.createElement('tr');
  tr.style.cursor = 'pointer';

// Step 4: Create the td element.
  var td = document.createElement('td');

// Step 5: Create the first div with the class row.
  var div1 = document.createElement('div');
  div1.classList.add('row');

// Step 6: Create the col-1 fs-5 div
  var div2 = document.createElement('div');
  div2.classList.add('col-1', 'fs-5');

// Step 7: Create the fw-bold col-10 fs-5 div.
  var div3 = document.createElement('div');
  div3.classList.add('fw-bold', 'col-10', 'fs-5');

// Step 8: Create the i element with the class 'mx-2 fe fe-message-square'
  var iElement = document.createElement('i');
  iElement.classList.add('mx-2', 'fe', icon);

// Step 9: Set the rest of the div's innerHTML.
  div3.innerHTML += title;

// Step 10: Append the iElement to div3 before the text.
  div3.insertBefore(iElement, div3.childNodes[0]);

// Step 11: Append the div2 and div3 to div1.
  div1.appendChild(div2);
  div1.appendChild(div3);

// Step 12: Append div1 to td.
  td.appendChild(div1);

// Step 13: Append td to tr.
  tr.appendChild(td);

// Step 14: Append tr to tbody.
  button.appendChild(tr);

  return button;
}

function createTopBtn(title, icon) {
  let buttonElement = document.createElement('button');

// Step 3: Set the type and class attributes of the button.
  buttonElement.setAttribute('type', 'button');
  buttonElement.classList.add('btn', 'btn-primary', 'btn-sm');

// Step 4: Create the i element and set its class.
  var iElement = document.createElement('i');
  iElement.classList.add('mx-2', 'fe', icon);

// Step 5: Set the button's innerHTML.
  buttonElement.innerHTML = title;

  buttonElement.style.margin = '2px';

// Step 6: Append the iElement to the button before the text.
  buttonElement.insertBefore(iElement, buttonElement.childNodes[0]);

  return buttonElement;
}

function createModalUpdate(modalBackground)
{


  var outerDiv = document.createElement('div');
  outerDiv.setAttribute('role', 'dialog');
  outerDiv.setAttribute('aria-modal', 'true');
  outerDiv.classList.add('fade', 'modal', 'show');
  outerDiv.style.display = 'block';

// Step 3: Create the modal-dialog div element.
  var modalDialogDiv = document.createElement('div');
  modalDialogDiv.classList.add('modal-dialog');

// Step 4: Create the modal-content div element.
  var modalContentDiv = document.createElement('div');
  modalContentDiv.classList.add('modal-content');

// Step 5: Create the modal-body div element.
  var modalBodyDiv = document.createElement('div');
  modalBodyDiv.classList.add('bg-light', 'modal-body');

  // Title
  var innerDivImage = document.createElement('span');
  innerDivImage.style.marginRight = '10px';
  var innerDivImageImg = document.createElement('img');
  innerDivImageImg.src = chrome.runtime.getURL('img/icons/icon-48.png');
  innerDivImageImg.alt = 'favicon-stackoverflow.com';
  innerDivImageImg.width = '48';
  innerDivImageImg.height = '48';
  innerDivImage.appendChild(innerDivImageImg);

  var modalTitleDiv = document.createElement('div');
  modalTitleDiv.classList.add('mb-5', 'modal-title', 'h2');
  modalTitleDiv.innerHTML = "Hey, what's up?";
  modalBodyDiv.appendChild(modalTitleDiv);

  modalTitleDiv.prepend(innerDivImage);

  var modalSubtitleDiv = document.createElement('div');
  modalSubtitleDiv.classList.add('mb-5', 'modal-title', 'h3');
  modalSubtitleDiv.innerHTML = `Latest updates of your ${appInfos.APP_NAME} extension:`;
  modalBodyDiv.appendChild(modalSubtitleDiv);

// First point
  var innerDiv1 = document.createElement('div');
  innerDiv1.classList.add('pb-2');
  innerDiv1.style.opacity = '1';

  // var innerDivLink = document.createElement('a');
  // innerDivLink.target = '_blank';
  // innerDivLink.classList.add('mb-0');
  // innerDivLink.rel = 'noreferrer';
  // innerDivLink.href = 'https://stackoverflow.com/questions/52910831/typeerror-failed-to-execute-appendchild-on-node-parameter-1-is-not-of-type';
  // innerDivLink.innerHTML = "TypeError: Failed to execute 'appendChild' on 'Node': parameter 1 is ...";

  let p1 = document.createElement('p');
  p1.classList.add('mb-0', 'fs-4');
  p1.innerHTML = "⨠ Now inside the Phind interface!";

  let desc1 = document.createElement('p');
  desc1.classList.add('mb-0', 'fs-5');
  desc1.innerHTML = "Now you can export a Phind thread directly using the button inside the interface (but you always can click on the extension icon).";

  innerDiv1.appendChild(p1);
  innerDiv1.appendChild(desc1);

  // Second point
  var innerDiv2 = document.createElement('div');
  innerDiv2.classList.add('pb-2');
  innerDiv2.style.opacity = '1';

  let p2 = document.createElement('p');
  p2.classList.add('mb-0', 'fs-4');
  p2.innerHTML = "⨠ Export all your threads in 1 click!";

  let desc2 = document.createElement('p');
  desc2.classList.add('mb-0', 'fs-5');
  // desc2.innerHTML = "Just click on the button \"Export All Threads\" and wait for the export to finish.";
  desc2.innerHTML = "It could be long, so you have time to drink your triple coffee dose 🙃.";

  innerDiv2.appendChild(p2);
  innerDiv2.appendChild(desc2);

  // Third point



  modalBodyDiv.appendChild(innerDiv1);
  modalBodyDiv.appendChild(innerDiv2);

// Step 8: Create the Close button.
  var closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.classList.add('m-1', 'btn', 'btn-secondary');
  closeButton.innerHTML = 'Close';

// Step 9: Append the inner divs and the Close button to the modal-content div.
  modalContentDiv.appendChild(modalBodyDiv);
  modalContentDiv.appendChild(closeButton);

// Step 10: Append the modal-dialog div to the outer div.
  modalDialogDiv.appendChild(modalContentDiv);

// Step 11: Append the outer div to the body.
  outerDiv.appendChild(modalDialogDiv);

  closeButton.addEventListener('click', function() {
    outerDiv.remove();
    modalBackground.remove();
  });

  return outerDiv;
}

function createModalBg() {
  var divElement = document.createElement('div');
  divElement.classList.add('fade', 'modal-backdrop', 'show');

  return divElement;
}