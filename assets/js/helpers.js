/**
 * Capitalize a string
 *
 * @param {String} str
 * @param {Number} 
 */
function capitalize(str) {
  if (!str) return str;
  return str[0].toUpperCase() + str.slice(1).toLowerCase();
}

function updateNameList(listDiv, names) {
  listDiv.innerHTML = '';
  names.forEach(function(name) {
    let li = document.createElement("li")
    li.innerText = name;
    li.classList.add('pure-menu-heading');
    listDiv.appendChild(li);
  });
}

export { capitalize, updateNameList };