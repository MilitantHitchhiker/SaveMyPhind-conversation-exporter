import {waitAppend} from "../uiEnhancer/elements/insertElements";
import {createSmallField} from "../uiEnhancer/elements/createElements";

export async function addListFilter() {
  // Create a text field for user input
  const input = await createSmallField('Search previous threads...');
  await waitAppend('.container.p-0 > .row', [input], 'insertBefore');

  // Event listener for changes in the text field
  input.addEventListener('input', () => {
    filterList(input, '.container.p-0 > .row tbody > tr', '.fs-6');
  });
}

// Filter the list based on the user input
function filterList(input, rowsSelector, textSelector) {
  const filterText = input.value.toLowerCase();
  const rows = document.querySelectorAll(rowsSelector);

  rows.forEach(row => {
    const text = row.querySelector(textSelector).textContent.toLowerCase();
    row.style.display = text.includes(filterText) ? '' : 'none';
  });
}