#!/usr/bin/env node
'use strict'

import path from 'node:path'
import { __iconmod_config__ } from '../dist/config'

const { assetPath } = __iconmod_config__

const outputPath = path.resolve(`${assetPath}`)

console.log(outputPath)
