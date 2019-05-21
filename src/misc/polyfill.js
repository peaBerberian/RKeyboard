// babel did not add that one to the es2017 plugin
// TODO ponyfill instead?
Object.values = Object.values || function (obj) {
  return Object.keys(obj).map(x => obj[x]);
};
