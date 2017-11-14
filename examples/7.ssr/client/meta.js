export let APP_KEY = "root"
// TODO
export let IS_SERVER = typeof window === "undefined" || !window.document || !window.document.createElement
export let IS_CLIENT = !IS_SERVER

