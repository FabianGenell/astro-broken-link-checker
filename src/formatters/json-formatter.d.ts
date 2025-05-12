import { ReportOptions } from '../../index';

export function formatJSON(
  brokenLinksMap: Map<string, Set<string>>,
  seoIssuesMap: Map<string, Map<string, Set<string>>>,
  options: ReportOptions
): string;