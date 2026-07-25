// Fixture: migration-rollout
// Reads a column introduced by the accompanying migration.sql, with no
// null check and no tolerance for the pre-migration schema state.

async function processExport(exportRow: ExportRow) {
  const format = exportRow.format.toUpperCase();
  return renderExport(exportRow, format);
}
