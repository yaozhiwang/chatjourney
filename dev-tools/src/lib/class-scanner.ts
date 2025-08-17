import fs from "fs"
import path from "path"

import { ClassRegistry } from "../types/class-registry"

export default class ClassScanner {
  private classPatterns: RegExp[] = [
    /className=["|'](.*?)["|']/g, // React
    /class=["|'](.*?)["|']/g, // HTML
    /classList\.add\(["|'](.*?)["|']\)/g, // JS
    /classList\.toggle\(["|'](.*?)["|']\)/g // JS
  ]

  private fileClassMap: { [key: string]: Set<string> } = {}
  private allClasses: Set<string> = new Set()

  private extractClassNames(content: string): Set<string> {
    const classNames = new Set<string>()

    this.classPatterns.forEach((pattern) => {
      let match: RegExpExecArray | null
      while ((match = pattern.exec(content)) !== null) {
        const classes = match[1].split(/\s+/)
        classes.forEach((cls) => {
          if (cls && cls.trim()) {
            classNames.add(cls.trim())
          }
        })
      }
    })

    return classNames
  }

  private scanFile(file: string): void {
    try {
      const content = fs.readFileSync(file, "utf8")
      const extractedClasses = this.extractClassNames(content)
      this.fileClassMap[file] = extractedClasses
      extractedClasses.forEach((cls) => this.allClasses.add(cls))
    } catch (error) {
      console.error(`Error scanning ${file}:`, error)
    }
  }

  public updateFile(file: string, action: "add" | "change" | "unlink"): void {
    const normalizedPath = path.resolve(file)

    if (action === "unlink") {
      if (this.fileClassMap[normalizedPath]) {
        this.fileClassMap[normalizedPath].forEach((cls) => {
          this.allClasses.delete(cls)
        })
        delete this.fileClassMap[normalizedPath]
      }
    } else {
      this.scanFile(normalizedPath)
    }

    this.allClasses.clear()
    Object.values(this.fileClassMap).forEach((classes) => {
      classes.forEach((cls) => this.allClasses.add(cls))
    })
  }

  public getClassRegistry(): ClassRegistry {
    return {
      lastUpdated: new Date().toISOString(),
      classes: Array.from(this.allClasses).sort(),
      files: Array.from(Object.keys(this.fileClassMap))
    }
  }
}
