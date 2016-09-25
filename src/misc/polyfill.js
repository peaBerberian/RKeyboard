// babel did not add that one to the es2017 plugin
Object.values = Object.values || function (obj) {
  return Object.keys(obj).map(x => obj[x]);
};
