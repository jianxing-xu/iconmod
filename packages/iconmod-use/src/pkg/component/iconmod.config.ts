export interface IIconmodConfig {
  provider: string
  assetPath: string
  offlineMode: 'symbol' | 'json'
}
export const __iconmod_config__: IIconmodConfig = {
  provider: '',
  assetPath: '',
  offlineMode: 'json',
}
export function setConfig(config: IIconmodConfig) {
  if (!config.provider)
    throw new Error('called `setConfig`. config.provider is required')
  if (!config.assetPath)
    throw new Error('called `setConfig`. config.assetPath is required')

  Object.assign(__iconmod_config__, config)
}
