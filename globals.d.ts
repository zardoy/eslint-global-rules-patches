declare type RuleFix = {
    range: [number, number]
    text: string
}

declare type ReportedMessage =
    | {
          ruleId: null
          message: string
          line: number
          column: number
          severity: number
          nodeType: null
          fix?: RuleFix
      }
    | {
          ruleId: string
          message: string
          line: number
          column: number
          endLine: number
          endColumn: number
          severity: number
          nodeType: null
          fix?: RuleFix
          suggestions?: { messageId?: string; desc: string; fix: RuleFix }[]
          messageId?: string
      }
