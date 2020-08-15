const shortener = document.getElementById("shortener");
const deleter = document.getElementById("deleter");
const urlList = document.getElementById("urlList");
const formInput = document.getElementById("urlInput");
const httpsButton = document.getElementById("https")

shortener.addEventListener("submit", (e) => fetchData(e));
deleter.addEventListener("click", () => deleteAll());
httpsButton.addEventListener("click",(e)=>{e.preventDefault(); formInput.value = "https://"; console.log('fired button')})

document.addEventListener("DOMContentLoaded", () => checkDatabase());

function newCode(e) {
  let oldId = e.target.parentElement.id;
  let element = e.target.parentElement.childNodes[1];
  let newId = generateId(5);
  e.target.parentElement.id = newId;
  element.innerHTML = window.location.href + newId;
  element.href = `/${newId}`;
  console.log("new id:", newId);
  fetch("/", {
    method: "POST",
    body: JSON.stringify({ newId: newId, oldId: oldId, url: window.location.href  }),
  });
}

function generateId(len) {
  let r = Math.random().toString(36).substring(len);
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
    entry.className = 'link'

    let link = document.createElement("a");
    link.href = el.short;
    link.target = "__blank";
    link.innerHTML = el.short;

    let host = document.createElement("span");
    host.innerHTML = el.host;

    let path = document.createElement("span");
    path.innerHTML = el.path;

    let random = document.createElement("button");
    random.innerHTML = "new";
    random.className = 'new'
    random.addEventListener("click", (e) => newCode(e));

    let remove = document.createElement("button");
    remove.innerHTML = "remove";
    remove.addEventListener("click", (e) => removeEl(e));

    entry.append(random, link, host, path, remove);
    urlList.append(entry);
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

  formInput.value = ''

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

function deleteAll() {
  urlList.innerHTML = "";
  fetch("/delete", { method: "POST", body: "" });
}

function removeEl(e) {
  let id = e.target.parentElement.id;
  console.log(id);

  try {
    let element = document.getElementById(id);
    element.remove();
  } catch {
    console.log("no element with that id");
  }

  fetch("/delete", { method: "POST", body: id });
}
