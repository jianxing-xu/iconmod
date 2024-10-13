import cookie from '@fastify/cookie'
import fastifyFormBody from '@fastify/formbody'
import jwt from '@fastify/jwt'
import fastify from 'fastify'
import { appConfig, httpHeaders } from '../config/app.js'
import { runWhenLoaded } from '../data/loading.js'
import { iconNameRoutePartialRegEx, iconNameRouteRegEx, splitIconName } from '../misc/name.js'
import { handleJSONResponse } from './helpers/send.js'
import { handleIconsDataResponse } from './helpers/send-icons.js'
import { createAPIv1IconsListResponse } from './responses/collection-v1.js'
import { createAPIv2CollectionResponse } from './responses/collection-v2.js'
import { createCollectionsListResponse } from './responses/collections.js'
import { generateIconsStyleResponse } from './responses/css.js'
import { createKeywordsResponse } from './responses/keywords.js'
import { createLastModifiedResponse } from './responses/modified.js'
import {
  handleAddIcons,
  handleAddUserToProject,
  handleCreateProject,
  handleDeleteUserOfProject,
  handleMemberList,
  handlePackSvgJson,
  handlePackSvgSymbolUse,
  handleRemoveIconsFromProject,
  handleUploadIconsToProject,
  queryAllProejcts,
  queryProjectInfo,
} from './responses/project.js'
import { createAPIv2SearchResponse } from './responses/search.js'
import { generateSVGResponse, handleClearSvgs } from './responses/svg.js'
import { generateUpdateResponse } from './responses/update.js'
import { handleLogin, handleRegister, handleSearchUser, handleUserInfo } from './responses/user.js'
import { initVersionResponse, versionResponse } from './responses/version.js'

/**
 * Start HTTP server
 */
export async function startHTTPServer() {
  // Create HTP server
  const server = fastify({
    caseSensitive: true,
  })

  // Support `application/x-www-form-urlencoded`
  server.register(fastifyFormBody)
  server.register(jwt, {
    secret: 'icoomod',
    cookie: {
      cookieName: 'iconmod-token',
      signed: false,
    },
  })
  server.register(cookie)

  // Generate headers to send
  interface Header {
    key: string
    value: string
  }
  const headers: Header[] = []
  httpHeaders.forEach((item) => {
    const parts = item.split(':')
    if (parts.length > 1) {
      headers.push({
        key: parts.shift() as string,
        value: parts.join(':').trim(),
      })
    }
  })
  server.addHook('preHandler', (req, res, done) => {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]
      res.header(header.key, header.value)
    }
    done()
  })
  const ignoreRotues = [
    '/update',
    '/user/login',
    '/user/register',
    '/last-modified',
    '/robot.txt',
    '/collections',
    '/collection',
    '/search',
    '/list-icons',
    '/keywords',
    '/project/packsvg',
  ]
  const ignoreSuffix = ['.svg', '.css', '.json', '.js']
  server.addHook('onRequest', async (request, reply) => {
    const routerPath = request.routeOptions.url as string
    console.log('[On Request]: ', request.routerPath)
    if (ignoreRotues.includes(routerPath) || ignoreSuffix.some(ext => routerPath.endsWith(ext))) {
      return
    }
    try {
      await request.jwtVerify()
    }
    catch (err) {
      reply.send({ code: 400, error: err, message: 'token error' })
    }
  })

  // Init various responses
  await initVersionResponse()

  // Types for common params
  interface PrefixParams {
    prefix: string
  }
  interface NameParams {
    name: string
  }

  /** user */
  // login
  server.post('/user/login', (req, res) => runWhenLoaded(() => handleLogin(req, res)))
  // register
  server.post('/user/register', (req, res) => runWhenLoaded(() => handleRegister(req, res)))
  // user
  server.get('/user/info', (req, res) => runWhenLoaded(() => handleUserInfo(req, res)))
  // search user
  server.get('/user/search', (req, res) => runWhenLoaded(() => handleSearchUser(req, res)))
  /** project */
  // add user to project
  server.post('/project/adduser', (req, res) => runWhenLoaded(() => handleAddUserToProject(req, res)))
  server.post('/project/deluser', (req, res) => runWhenLoaded(() => handleDeleteUserOfProject(req, res)))
  // add to some icon to owner project
  server.post('/project/addicons', (req, res) => runWhenLoaded(() => handleAddIcons(req, res)))
  server.post('/project/upload', (req, res) => runWhenLoaded(() => handleUploadIconsToProject(req, res)))
  // remove icons from project
  server.post('/project/removeicons', (req, res) => runWhenLoaded(() => handleRemoveIconsFromProject(req, res)))
  // project members
  server.get('/project/members', (req, res) => runWhenLoaded(() => handleMemberList(req, res)))
  // create project
  server.post('/project/create', (req, res) => runWhenLoaded(() => handleCreateProject(req, res)))
  server.get('/project/list', (req, res) => runWhenLoaded(() => queryAllProejcts(req, res)))
  server.get('/project/info', (req, res) => runWhenLoaded(() => queryProjectInfo(req, res)))
  server.get('/project/packsvg', (req, res) => handlePackSvgJson(req, res))
  server.get('/project/packsvgSymbol', (req, res) => runWhenLoaded(() => handlePackSvgSymbolUse(req, res)))

  // SVG: /prefix/icon.svg, /prefix:name.svg, /prefix-name.svg
  server.get(`/:prefix(${iconNameRoutePartialRegEx})/:name(${iconNameRoutePartialRegEx}).svg`, (req, res) => {
    type Params = PrefixParams & NameParams
    const name = req.params as Params
    res.header('Cache-Control', 'public, max-age=3600')
    runWhenLoaded(() => {
      generateSVGResponse(name.prefix, name.name, req.query, res)
    })
  })

  // SVG: /prefix:name.svg, /prefix-name.svg
  server.get(`/:name(${iconNameRouteRegEx}).svg`, (req, res) => {
    const name = splitIconName((req.params as NameParams).name)
    res.header('Cache-Control', 'public, max-age=3600')
    if (name) {
      runWhenLoaded(() => {
        generateSVGResponse(name.prefix, name.name, req.query, res)
      })
    }
    else {
      res.send(404)
    }
  })

  // Icons data: /prefix/icons.json, /prefix.json
  server.get(`/:prefix(${iconNameRoutePartialRegEx})/icons.json`, (req, res) => {
    res.header('Cache-Control', 'public, max-age=3600')
    runWhenLoaded(() => {
      handleIconsDataResponse((req.params as PrefixParams).prefix, false, req.query, res)
    })
  })
  server.get(`/:prefix(${iconNameRoutePartialRegEx}).json`, (req, res) => {
    res.header('Cache-Control', 'public, max-age=3600')
    runWhenLoaded(() => {
      handleIconsDataResponse((req.params as PrefixParams).prefix, false, req.query, res)
    })
  })

  // Stylesheet: /prefix.css
  server.get(`/:prefix(${iconNameRoutePartialRegEx}).css`, (req, res) => {
    res.header('Cache-Control', 'public, max-age=3600')
    runWhenLoaded(() => {
      generateIconsStyleResponse((req.params as PrefixParams).prefix, req.query, res)
    })
  })

  // Icons data: /prefix/icons.js, /prefix.js
  server.get(`/:prefix(${iconNameRoutePartialRegEx})/icons.js`, (req, res) => {
    res.header('Cache-Control', 'public, max-age=3600')
    runWhenLoaded(() => {
      handleIconsDataResponse((req.params as PrefixParams).prefix, true, req.query, res)
    })
  })
  server.get(`/:prefix(${iconNameRoutePartialRegEx}).js`, (req, res) => {
    res.header('Cache-Control', 'public, max-age=3600')
    runWhenLoaded(() => {
      handleIconsDataResponse((req.params as PrefixParams).prefix, true, req.query, res)
    })
  })

  // Last modification time
  server.get('/last-modified', (req, res) => {
    runWhenLoaded(() => {
      handleJSONResponse(req, res, createLastModifiedResponse)
    })
  })

  if (appConfig.enableIconLists) {
    // Icon sets list
    server.get('/collections', (req, res) => {
      runWhenLoaded(() => {
        handleJSONResponse(req, res, createCollectionsListResponse)
      })
    })

    // Icons list, API v2
    server.get('/collection', (req, res) => {
      runWhenLoaded(() => {
        handleJSONResponse(req, res, createAPIv2CollectionResponse)
      })
    })

    // Icons list, API v1
    server.get('/list-icons', (req, res) => {
      runWhenLoaded(() => {
        handleJSONResponse(req, res, q => createAPIv1IconsListResponse(q, false))
      })
    })
    server.get('/list-icons-categorized', (req, res) => {
      runWhenLoaded(() => {
        handleJSONResponse(req, res, q => createAPIv1IconsListResponse(q, true))
      })
    })

    if (appConfig.enableSearchEngine) {
      // Search, currently version 2
      server.get('/search', (req, res) => {
        runWhenLoaded(() => {
          handleJSONResponse(req, res, createAPIv2SearchResponse)
        })
      })

      // Keywords
      server.get('/keywords', (req, res) => {
        runWhenLoaded(() => {
          handleJSONResponse(req, res, createKeywordsResponse)
        })
      })
    }
  }

  // Update icon sets
  server.get('/update', (req, res) => {
    generateUpdateResponse(req.query, res)
  })
  server.post('/update', (req, res) => {
    generateUpdateResponse(req.query, res)
  })

  // SVG process function
  server.post('/clearSVGs', async (req, res) => handleClearSvgs(req, res))

  // Options
  server.options('/*', (req, res) => {
    res.send(200)
  })

  // Robots
  server.get('/robots.txt', (req, res) => {
    res.send('User-agent: *\nDisallow: /\n')
  })

  // Version
  if (appConfig.enableVersion) {
    server.get('/version', (req, res) => {
      versionResponse(req.query, res)
    })
    server.post('/version', (req, res) => {
      versionResponse(req.query, res)
    })
  }

  // Redirect
  server.get('/', (req, res) => {
    res.redirect(301, appConfig.redirectIndex)
  })

  // Error handling
  server.setNotFoundHandler((req, res) => {
    res.statusCode = 404
    console.log('404:', req.url)

    // Need to set custom headers because hooks don't work here
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]
      res.header(header.key, header.value)
    }

    res.send()
  })

  // Start it
  console.log('Listening on', `${appConfig.host}:${appConfig.port}`)
  server.listen({
    host: appConfig.host,
    port: appConfig.port,
  })
}
