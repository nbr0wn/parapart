
// Helper functions for handling input changes in the customizer UI

// Update the customization object
function updateCustomizations(varname, value) {
    //console.log(`Setting ${varname} to ${value}`);
    globalThis.parapart.part.customization[varname] = value;
}

// Update the slider thumb position based on the textbox input
function moveSliderThumb(uniqueTag, varname, min, max) {
    const slider = document.getElementById(`slider-${uniqueTag}`);
    const sliderTxt = document.getElementById(`sliderTxt-${uniqueTag}`);

    // Apply our constraints in case they typed something wild
    // into the combo box
    // TODO - Fix the limit checks
//  if (typeof min != 'undefined') {
//      if (sliderTxt.value < min) {
//          sliderTxt.value = min;
//      }
//  }
//  if (sliderTxt.value > max) {
//      sliderTxt.value = max;
//  }
    slider.value = sliderTxt.value;
    updateCustomizations(varname, slider.value);
}

// Update slider value textbox based on slider thumb position
function updateSliderTxt(uniqueTag, varname) {
    const slider = document.getElementById(`slider-${uniqueTag}`);
    const sliderTxt = document.getElementById(`sliderTxt-${uniqueTag}`);
    sliderTxt.value = slider.value;
    updateCustomizations(varname, sliderTxt.value);
}

function updateCheckBox(uniqueTag, varname) {
    const bool = document.getElementById(`check-${uniqueTag}`);
    updateCustomizations(varname, bool.checked);
}

function updateSelect(uniqueTag, varname) {
    const select = document.getElementById(`select-${uniqueTag}`);
    updateCustomizations(varname, select.value);
}

function updateSpinBox(uniqueTag, varname) {
    const spin = document.getElementById(`spin-${uniqueTag}`);
    updateCustomizations(varname, spin.value);
}

function updateVector(uniqueTag, varname) {
    const vector = document.getElementById(`vector-${uniqueTag}`);
    updateCustomizations(varname, vector.value);
}

function updateTextBox(uniqueTag, varname) {
    const text = document.getElementById(`text-${uniqueTag}`);
    updateCustomizations(varname, text.value);
}

function updateComboBox(uniqueTag, varname) {
    const combo = document.getElementById(`combo-${uniqueTag}`);
    updateCustomizations(varname, combo.value);
}

