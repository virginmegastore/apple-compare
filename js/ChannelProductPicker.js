/**
 * Viewport flags - used for local instance and export
 * @type { MediaQueryList }
 */
const viewportSm = window.matchMedia('(max-width: 734px)');
const viewportMd = window.matchMedia('(min-width: 735px) and (max-width: 1068px)');
const viewportLg = window.matchMedia('(min-width: 1069px)');
const viewportArray = [viewportLg, viewportMd, viewportSm];

/**
 * Main controller for non-static dropdowns
 * Includes media query setup for export
 */
function ProductPicker (selectEls) {
  let order = [];
  let defaultProducts = [];
  let newIndexes = {};
  let viewportIndex = 0;
  // get allowed columns to be rendered on the page
  let allowedColumns = parseInt(getComputedStyle(document.querySelector('.channel-compare')).getPropertyValue('--columns')) || 3;
  const headerRow = document.querySelectorAll('[compare-header-row]');
  let headerHTML = `<div role="columnheader">&nbsp;</div>`
  // get indexes for each column/viewport
  let columnIndexes = getComputedStyle(document.querySelector('.channel-compare')).getPropertyValue('--column-data') || [0,1,2,0,1,2,0,1,2];
  let allowedColumnsArray = getComputedStyle(document.querySelector('.channel-compare')).getPropertyValue('--allowed-columns').replace(/\s/g, '').split(',');

  // create array
  let indexCollection = columnIndexes.split(',').map(function(item) {
    return parseInt(item.trim());
  });

  // split array into viewport groups
  const splitArray = (arr, allowed) => {
    const res = [arr.slice(0, allowed[0]), arr.slice(allowed[0]).slice(0, allowed[1]), arr.slice(parseInt(allowed[0]) + parseInt(allowed[1])).slice(0, allowed[2])];
    return res;
  };

  // define default column indexes
  defaultProducts = splitArray(indexCollection, allowedColumnsArray);

  // create this.selectEls array from node list
  this.selectEls = Array.prototype.slice.call(selectEls);

  // populates columns in each row
  this.columns = this.getColumns(this.selectEls[0]);

  /**
   * Loop through each select and setup
   */
  this.selectEls.forEach(function (select, index) {
    let option = select.querySelector('[aria-selected ="true"]');
    let selectedOptions = select.selectedOptions;
    let fallbackValue = select.options[select.selectedIndex].value;

    // Add header div per column
    headerHTML += `<div role="columnheader">${select.selectedOptions[0].textContent}</div>`

    select.selectedIndex = Array.prototype.slice.call(select.options).indexOf(option);
    option.setAttribute('selected', 'true');

    // set order array
    if (selectedOptions) {
      order.push(parseInt(selectedOptions[0].value));
    } else {
      order.push(parseInt(fallbackValue));
    }

    /**
     * Sets viewport flags and keeps indexes updated accordingly
     * Checks for manual select changes, otherwise refers to defaultProducts
     */
    const setMediaQueries = () => {
      const handleChange = () => {
        allowedColumns = viewportLg.matches ? allowedColumnsArray[0] : viewportMd.matches ? allowedColumnsArray[1] : viewportSm.matches ? allowedColumnsArray[2] : 3;
        viewportArray.forEach((viewport, i) => {
          let currentIndex = selectedOptions ? parseInt(selectedOptions[0].value) : parseInt(fallbackValue);
          // check for viewport matches
          if (viewport.matches) {
            viewportIndex = i;

            // check for new selections
            if (newIndexes.hasOwnProperty(`column${viewportIndex}${index}`)) {
              let newIndex = parseInt(newIndexes[`column${viewportIndex}${index}`]);
              this.update(index, newIndex, currentIndex, true, headerRow, allowedColumns);
              // update order array
              order[index] = newIndex;
            } else {
              this.update(index, defaultProducts[viewportIndex][index], currentIndex, index < parseInt(allowedColumnsArray[i]), headerRow, allowedColumns);
              // update order array
              order[index] = defaultProducts[viewportIndex][index];
            }
          }
        })
      };

      // attach viewport event listener
      viewportArray.forEach((viewport) => {
        function handleUpdate(e) {
          if(e.matches) {
            handleChange(e);
            if(document.reorderDOM) {
              document.reorderDOM();
            }
            const selects = document.getElementsByClassName('selector-dropdown');
            for(var x = 0; x < selects.length; x++) {
              selects[x].blur();
            }
          }
        }
        try {
          if(typeof viewport.addEventListener !== 'function') {
            viewport.addListener(handleUpdate);
          } else {
            viewport.addEventListener('change', (e) => {
              handleChange(e);
              if(document.reorderDOM) {
                document.reorderDOM();
              }
              this.selectEls.forEach((elem) => {
                elem.blur();
              });
            });
          }
        } catch(err) {
          console.log('The Error is: ', err);
        }
        // on init
        handleChange(viewport);
        if(document.reorderDOM) {
          document.reorderDOM();
        }
        this.selectEls.forEach((elem) => {
          elem.blur();
        });
      });
    };

    setMediaQueries();

    /**
     * Select onchange event handler
     * Checks for index collisions + updates order array and newIndexes obj
     */
    select.onchange = function () {
      allowedColumns = viewportLg.matches ? parseInt(allowedColumnsArray[0]) : viewportMd.matches ? parseInt(allowedColumnsArray[1]) : viewportSm.matches ? parseInt(allowedColumnsArray[2]) : 3;
      let selectedProductIndex = selectedOptions ? parseInt(selectedOptions[0].value) : parseInt(fallbackValue);
      let existingPos = order.slice(0, allowedColumns).indexOf(selectedProductIndex);
      // perform swap - if needed
      if (existingPos > -1) {
        let swapValue =  order[index];
        this.update(existingPos, swapValue, order[existingPos], true, headerRow, allowedColumns);
        order[existingPos] = swapValue;
        newIndexes[`column${viewportIndex}${existingPos}`] = swapValue.toString();
      }

      this.update(index, selectedProductIndex, order[index], true, headerRow, allowedColumns);
      // update order array
      order[index] = selectedProductIndex;
      // update newIndexes obj
      newIndexes[`column${viewportIndex}${index}`] = selectedProductIndex.toString();
      // reorder dom
      document.reorderDOM();
    }.bind(this);

  }.bind(this));
  headerRow[0].innerHTML = headerHTML;
}

let proto = ProductPicker.prototype;

/**
 * Update function - sets active/inactive indexes
 * @param {number} current - column
 * @param {number} nextProductIndex - newly selected index
 * @param {number} currentProductIndex - index to be changed
 * @param {boolean} nextDefined - used to bypass update for non visible dropdowns
 * @param {array} headerRow - header row to be added
 * @param {number} allowedColumns - number of columns allowed
 */
proto.update = function (current, nextProductIndex, currentProductIndex, nextDefined, headerRow, allowedColumns) {
  if (this.selectEls == null) return;
  if (!nextDefined) return;

  let columnClass = 'compare-column-' + current;
  let currentOptionIndex = this.getOptionIndexByValue(currentProductIndex);
  let nextOptionIndex = this.getOptionIndexByValue(nextProductIndex);
  this.selectEls[current].selectedIndex = nextOptionIndex;

  let currentColumns = this.getColumnsByProductIndex(currentProductIndex);
  let nextColumns = this.getColumnsByProductIndex(nextProductIndex);

  currentColumns.forEach( function(el, index){
    el.classList.remove(columnClass);
    nextColumns[index].classList.remove('compare-column-0', 'compare-column-1', 'compare-column-2', 'compare-column-3', 'compare-column-4');
    nextColumns[index].classList.add(columnClass);
  });

  this.selectEls[current].options[currentOptionIndex].removeAttribute('aria-selected');
  this.selectEls[current].options[currentOptionIndex].removeAttribute('selected');

  this.selectEls[current].options[nextOptionIndex].setAttribute('aria-selected', 'true');
  this.selectEls[current].options[nextOptionIndex].setAttribute('selected', 'true');

  // Reorder header on change of select
  let newHeaderHTML = `<div role="columnheader">&nbsp;</div>`
  this.selectEls.forEach((element, i) =>  {
    if (i < allowedColumns) {
      newHeaderHTML += `<div role="columnheader">${element.selectedOptions[0].textContent}</div>`
    }
  })
  if (headerRow && headerRow[0]) {
    headerRow[0].innerHTML = newHeaderHTML;
  }
}

proto.getOptionIndexByValue = function (value) {
  return this.valueIndexMap[value];
}

proto.getColumnsByProductIndex = function (productIndex) {
  return this.columns[productIndex];
}

proto.getColumns = function (parent) {
  let columns = [];
  this.valueIndexMap = {}
  let options = Array.prototype.slice.call(parent.querySelectorAll('option'));
  options.forEach(function (option, domOrder){
    let productIndex = option.value;
    this.valueIndexMap[productIndex] = domOrder;
    columns[productIndex] = Array.prototype.slice.call(document.querySelectorAll('.product-' + productIndex));
  }.bind(this));
  return columns;
}

proto.destroy = function () {
  this.selectEls.forEach(function (select){
    select.onchange = null
  }.bind(this))
  this.selectEls = null
}

// local vs export
if (typeof module === 'object' && module.exports) {
  module.exports = { ProductPicker, viewportArray }
} else {
  new ProductPicker(document.querySelectorAll('.selector-dropdown'));
}
