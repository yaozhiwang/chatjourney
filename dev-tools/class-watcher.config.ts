export interface ClassWatcherConfig {
  scanDirs: string[]
  wsPort: number
}

const config: ClassWatcherConfig = {
  scanDirs: ["./src/content-scripts", "./src/components"],
  wsPort: 8765
}

export default config
