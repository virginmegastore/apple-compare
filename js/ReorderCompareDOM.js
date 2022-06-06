const viewportSmRO = window.matchMedia('(max-width: 734px)');
const viewportMdRO = window.matchMedia('(min-width: 735px) and (max-width: 1068px)');
const viewportLgRO = window.matchMedia('(min-width: 1069px)');
const viewportArrayRO = [viewportLgRO, viewportMdRO, viewportSmRO];

const reorderDOM = () => {

  // Parent selectors for each row
  const parents = document.querySelectorAll('[data-column-group]');

  // Cycle parent rows
  parents.forEach(parentEl => {

    // Get descendants as Array
    const columnEls = Array.from(parentEl.children);
    const rowHeaderEl = parentEl.querySelector('.compare-rowheader');

    // Filter to 'flex' only; ignore `display:none`
    const columnFlex = columnEls.filter(col => {
      return window.getComputedStyle(col).display === 'flex';
    });

    // Order column array based on `order:[0-9]` cast by CSS
    const columnByFlexOrder = columnFlex.sort((col1, col2) => {
      const col1order = Number(window.getComputedStyle(col1).order);// Numberize
      const col2order = Number(window.getComputedStyle(col2).order);// Numberize

      if (col1order < col2order) return 1;
      if (col1order > col2order) return -1;
      return 0;
    })

    // Prepend by order of appearance
    columnByFlexOrder.forEach(column => {
      parentEl.prepend(column);
    });

    // Prepend rowheader
    parentEl.prepend(rowHeaderEl);
  });
};

const updateColumnHeader = () => {
  let headerRow = document.querySelectorAll('[compare-column-header-static]');
  if (headerRow.length === 0) return;

  let axHeaderRow = document.querySelectorAll('[compare-header-row]');
  let headerHTML = `<div role="columnheader">&nbsp;</div>`
  headerRow.forEach((element) => {
    if(element.offsetParent !== null) {
      headerHTML += `<div role="columnheader">${element.textContent}</div>`;
    }
  });
  axHeaderRow[0].innerHTML = headerHTML;

}

viewportArrayRO.forEach((viewportRO, i) => {
  function handleUpdateRO(e) {
    let staticEnabled = window
      .getComputedStyle(document.querySelector('.channel-compare'))
      .getPropertyValue('--static-enabled');
    staticEnabled && reorderDOM();
    staticEnabled && updateColumnHeader();
  }
  try {
    if(typeof viewportRO.addEventListener !== 'function') {
      viewportRO.addListener(handleUpdateRO);
    } else {
      viewportRO.addEventListener('change', (e) => {
        let staticEnabled = window
          .getComputedStyle(document.querySelector('.channel-compare'))
          .getPropertyValue('--static-enabled');
        staticEnabled && reorderDOM();
        staticEnabled && updateColumnHeader();
      });
    }
  } catch(err) {
    console.log('The Error is: ', err);
  }
});

const setChangeEvent = () => {
  const selects = document.querySelectorAll('.selector-dropdown');
  selects.forEach((select, i) => {
    select.addEventListener('change', (e) => reorderDOM());
  });
  // on load
  reorderDOM();
}

// Share to other script
document.reorderDOM = reorderDOM;

if (typeof module === 'object' && module.exports) {
  module.exports = { reorderDOM, updateColumnHeader }
} else {
  setChangeEvent();
}
