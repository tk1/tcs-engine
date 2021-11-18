function dfs (nodes, sources) {
  for (const s of sources) {
    s.marked = true
    s.edgesOut.forEach(e => {
      if (!e.sink.marked) {
        dfs(nodes, new Set([e.sink]))
      }
    })
  }
}

exports.dfs = dfs
