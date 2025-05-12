import { ReportOptions } from '../../index';

export function formatCSV(
  brokenLinksMap: Map<string, Set<string>>,
  seoIssuesMap: Map<string, Map<string, Set<string>>>,
  options: ReportOptions
): string;