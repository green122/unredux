export default ({appHTML}) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charSet="utf-8"/>
        <title>7.0 SSR with data loading</title>
      </head>
      <body>
          <div id="root">
            ${appHTML}
          </div>
          <script src="/js/app.js"></script>
          <script>
            window.state = {} // TODO
          </script>
      </body>
    </html>`
}

// TODO helmet
