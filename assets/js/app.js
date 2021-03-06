import "purecss/build/pure-min.css";
import "../css/style.css";

import uniqueBoyNames from "./uniqueBoyNames";
import uniqueGirlNames from "./uniqueGirlNames";
import Autocomplete from 'autocomplete';
import { capitalize, updateNameList, createChart, createMap } from './helpers'

let maleAutocomplete = Autocomplete.connectAutocomplete();
maleAutocomplete.initialize(wordAdd => wordAdd(uniqueBoyNames));

let femaleAutocomplete = Autocomplete.connectAutocomplete();
femaleAutocomplete.initialize(wordAdd => wordAdd(uniqueGirlNames));

let currentAutocomplete = femaleAutocomplete;

document.addEventListener('DOMContentLoaded', function() {

  let input = document.getElementById("name-input");
  let form = document.getElementById("name-form");
  let namesList = document.getElementById("name-list");

  // keep autocomplete current
  form.addEventListener('mousedown', function(e) {
    if (e.target.type === "radio") {
      currentAutocomplete = e.target.value === "male" ?
                            maleAutocomplete :
                            femaleAutocomplete;
    }
  });

  // update autocomplete while typing
  input.addEventListener('keyup', function(e) {
    let name = capitalize(e.target.value);
    updateNameList(namesList, currentAutocomplete.search(name));
  });

  input.addEventListener('focus', function(e) {
    updateNameList(namesList, currentAutocomplete.search(capitalize(input.value)));
    namesList.classList.remove('hidden');
  });

  input.addEventListener('blur', function(e) {
    namesList.classList.add('hidden');
  });

  // set input value when selecting from autocomplete
  namesList.addEventListener('mousedown', function(e) {
    let tgt = e.target;
    if (tgt.tagName === "LI") {
      input.value = tgt.innerText;
      updateNameList(namesList, currentAutocomplete.search(capitalize(input.value)));
    }
  });

  // handle form submission
  form.addEventListener('submit', function(e) {
    e.preventDefault();

    let gender = document.querySelector("input:checked").value;
    let name = capitalize(input.value);
    document.getElementById("name-header").innerText = name || "NO NAME ENTERED";
    namesList.innerHTML = '';
    document.querySelector('.banner').classList.add('submitted');
    document.getElementById('results').classList.add('submitted');

    createChart('graph', name, gender);
    createMap('map', name, gender);
    
  });
  
});