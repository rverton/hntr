package frontend

import "embed"

//go:embed out
//go:embed out/_next
//go:embed out/_next/static/chunks/pages/*.js
//go:embed out/_next/static/*/*.js
var Files embed.FS
