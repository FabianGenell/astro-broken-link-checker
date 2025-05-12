export function checkPerformancePhase(
  htmlContent: string,
  issuesMap: Map<string, Map<string, Set<string>>>,
  baseUrl: string,
  documentPath: string,
  distPath: string,
  options?: Record<string, any>
): Promise<void>;