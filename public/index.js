const shortener = document.getElementById("shortener");

const urlList = document.getElementById("urlList");
const formInput = document.getElementById("urlInput");

shortener.addEventListener("submit", (e) => fetchData(e));


document.addEventListener("DOMContentLoaded", () => checkDatabase());

/*

function newCode(e) {
  let oldId = e.target.parentElement.parentElement.id;
  let element = e.target.parentElement.parentElement.childNodes[1];
  let newId = generateId(3);
  e.target.parentElement.id = newId;
  element.innerHTML = `/${newId}`;
  element.href = `/${newId}`;
  console.log("new id:", newId);
  fetch("/", {
    method: "POST",
    body: JSON.stringify({
      newId: newId,
      oldId: oldId,
      url: window.location.href,
    }),
  });
}
*/

function generateId(len) {
  let r = Math.random().toString(36);
  let length = r.length;
  r = r.substring(length - len, length);
  return r;
}

async function checkDatabase() {
  console.log("posting request");

  let result = await fetch("/database", { method: "post" })
    .then((res) => res.json())
    .then((json) => {
      console.log(json.res);
      return json.res;
    });

  if ((await result.length) == 0) {
    console.log("no elements in the database");
  } else {
    console.log("rendering elements");
    renderElements(result);
  }
}

function renderElements(array) {
  console.log(typeof array);
  for (let el of array) {

    let entry = document.createElement("div");
    entry.id = el.code;
    entry.className = "link";

    let copy = document.createElement("i");
    copy.className = "far fa-copy";
    copy.addEventListener('click', e => copyLink(e))

    /*
    let random = document.createElement("i");
    random.className = "new fas fa-redo-alt";
    random.addEventListener("click", (e) => newCode(e));
    */
    let remove = document.createElement("i");
    remove.className = "remove fas fa-times";
    remove.addEventListener("click", (e) => removeEl(e));

    let icons = document.createElement("div");
    icons.className = 'icons'
    icons.append(remove, copy);

    let shortLink = document.createElement("span")
    shortLink.innerHTML = el.short.slice(0, el.short.length - 4)

    let link = document.createElement("a");
    link.href = el.short;
    link.target = "__blank";
    link.innerHTML = "/" + el.code;
    link.className = 'code'
    link.prepend(shortLink)

    let iconsLink = document.createElement('div');
    iconsLink.className = 'iconsLink'
    iconsLink.append(icons, link)

    let path = document.createElement("div");
    let content = document.createElement("p");
    content.innerHTML = el.long
    path.append(content)
    path.className = "path";

    entry.append(path, iconsLink);
    urlList.prepend(entry);
  }
}

function isValidUrl(string) {
  try {
    new URL(string);
  } catch (_) {
    return false;
  }
  return true;
}

function trimSlash(url) {
  return url.replace(/^(.+?)\/*?$/, "$1");
}

function fetchData(event) {
  event.preventDefault();

  const input = trimSlash(formInput.value);

  if (!isValidUrl(input)) {
    alert("not valid url");
    return;
  }

  formInput.value = "";

  const urlObj = { url: input };

  fetch("/", {
    method: "post",
    body: JSON.stringify(urlObj),
  })
    .then((res) => {
      return res.json();
    })
    .then((json) => {
      if (document.getElementById(json.code)) {
        console.log("already have one");
        return;
      } else {
        renderElements([json]);
      }
    });
}


function removeEl(e) {
  let id = e.target.parentElement.parentElement.parentElement.id;
  console.log(id);

  try {
    let element = document.getElementById(id);
    element.remove();
  } catch {
    console.log("no element with that id");
  }

  fetch("/delete", { method: "POST", body: id });
}

function copyLink(e) {
  let link = e.target.parentElement.parentElement.getElementsByClassName("code")[0].href
  navigator.clipboard.writeText(link)
    .then(() => {
      console.log('Text copied to clipboard', link);
    })
    .catch(err => {
      // This can happen if the user denies clipboard permissions:
      console.error('Could not copy text: ', err);
    });
}