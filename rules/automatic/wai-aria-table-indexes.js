"use strict";

/**
 * @check wai-aria-table-indexes
 * @summary A table's counts and indexes agree with its rows and cells
 * @applicability
 *   Elements of role table, grid or treegrid in the accessibility tree that
 *   carry aria-colcount or aria-rowcount, or whose rows or cells carry
 *   aria-colindex or aria-rowindex. A row is the table's where the table is
 *   its nearest table, grid or treegrid ancestor, and a cell the row's where
 *   the row is its nearest row ancestor.
 * @expectation
 *   WAI-ARIA 1.2: "Authors MUST set the value for aria-colindex to an
 *   integer greater than or equal to 1, greater than the aria-colindex value
 *   of any previous elements within the same row, and less than or equal to
 *   the number of columns in the full table", the same of aria-rowindex
 *   across rows, and aria-colcount and aria-rowcount to the number of
 *   columns and rows in the full table, or -1 where it is unknown. A count
 *   below what the page shows can't be the full table's. A value that is no
 *   integer, or below 1, is aria-valid-attr-value's to report.
 * @reason-codes
 *   - `COLINDEX_NOT_INCREASING` (fail): a cell's aria-colindex is not
 *     greater than an earlier cell's in its row.
 *   - `COLINDEX_ABOVE_COUNT` (fail): a cell's aria-colindex is above the
 *     table's aria-colcount.
 *   - `ROWINDEX_NOT_INCREASING` (fail): a row's aria-rowindex is not
 *     greater than an earlier row's.
 *   - `ROWINDEX_ABOVE_COUNT` (fail): a row's aria-rowindex is above the
 *     table's aria-rowcount.
 *   - `COLCOUNT_BELOW_COLUMNS` (fail): the table's aria-colcount is below
 *     the number of columns a row of it spans.
 *   - `ROWCOUNT_BELOW_ROWS` (fail): the table's aria-rowcount is below the
 *     number of its rows on the page.
 *     Basis for all: WAI-ARIA 1.2 aria-colindex, aria-rowindex,
 *     aria-colcount, aria-rowcount (MUST).
 */

const id = "wai-aria-table-indexes";

const CODES = [
  "COLINDEX_NOT_INCREASING",
  "COLINDEX_ABOVE_COUNT",
  "ROWINDEX_NOT_INCREASING",
  "ROWINDEX_ABOVE_COUNT",
  "COLCOUNT_BELOW_COLUMNS",
  "ROWCOUNT_BELOW_ROWS",
];

const meta = {
  title: "A table's counts and indexes agree with its rows and cells",
  description:
    "Checks that aria-colindex and aria-rowindex grow along a table and stay within aria-colcount and aria-rowcount, and that the counts are not below the columns and rows on the page.",
  i18n: {
    titleKey: "waiAriaTableIndexes_title",
    descriptionKey: "waiAriaTableIndexes_description",
  },
  tags: ["wai-aria", "aria", "atomic", "automatic"],
  wcagSc: [],
  defaultSeverity: "moderate",
  type: "automatic",
  defaultConfidence: "high",
  reasonCodes: CODES,
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;
  const { dom } = helpers;
  const TABLES = ["table", "grid", "treegrid"];
  const CELLS = ["cell", "gridcell", "columnheader", "rowheader"];
  // The roles HTML-AAM gives a table's elements, which getRoleInfo leaves
  // out: which kind of cell a td or th is doesn't matter here.
  const NATIVE = {
    table: "table",
    tr: "row",
    td: "cell",
    th: "cell",
    thead: "rowgroup",
    tbody: "rowgroup",
    tfoot: "rowgroup",
  };
  const roleOf = (el) => {
    let role = "";
    try {
      const info = helpers.getRoleInfo(el, ctx);
      role = (info && info.role) || "";
    } catch {
      role = "";
    }
    if (role || helpers.aria.getExplicitRole(el)) return role;
    return NATIVE[String(dom.localName(el) || "").toLowerCase()] || "";
  };
  // An attribute's integer value, or null where it is none.
  const intOf = (el, name) => {
    const v = String(dom.getAttribute(el, name) || "").trim();
    return /^-?\d+$/.test(v) ? parseInt(v, 10) : null;
  };
  // The nearest ancestor of one of `roles`, in the flat tree.
  const nearest = (el, roles) => {
    let p = helpers.flatParentElement(el);
    for (let guard = 0; p && guard < 200; guard++) {
      if (roles.includes(roleOf(p))) return p;
      p = helpers.flatParentElement(p);
    }
    return null;
  };
  const inTree = (el) => helpers.isIncludedInAccessibilityTree(el, ctx);
  const tables = helpers
    .queryAllSmart('table, [role~="table" i], [role~="grid" i], [role~="treegrid" i]')
    .filter((el) => TABLES.includes(roleOf(el)) && inTree(el));
  const rowsOf = new Map(tables.map((t) => [t, []]));
  for (const row of helpers.queryAllSmart('tr, [role~="row" i]')) {
    if (roleOf(row) !== "row" || !inTree(row)) continue;
    const table = nearest(row, TABLES);
    if (rowsOf.has(table)) rowsOf.get(table).push({ row, cells: [] });
  }
  const rowEntry = new Map();
  for (const rows of rowsOf.values()) for (const r of rows) rowEntry.set(r.row, r);
  for (const cell of helpers.queryAllSmart(
    'td, th, [role~="cell" i], [role~="gridcell" i], [role~="columnheader" i], [role~="rowheader" i]',
  )) {
    if (!CELLS.includes(roleOf(cell)) || !inTree(cell)) continue;
    const entry = rowEntry.get(nearest(cell, ["row"]));
    if (entry) entry.cells.push(cell);
  }
  const ATTRS = ["aria-colindex", "aria-rowindex"];
  const applicable = tables.filter(
    (t) =>
      intOf(t, "aria-colcount") !== null ||
      intOf(t, "aria-rowcount") !== null ||
      rowsOf
        .get(t)
        .some(
          (r) =>
            ATTRS.some((a) => intOf(r.row, a) !== null) ||
            r.cells.some((c) => ATTRS.some((a) => intOf(c, a) !== null)),
        ),
  );
  if (!applicable.length) {
    return {
      ruleId: rule.ruleId,
      outcome: "notApplicable",
      severity: "minor",
      occurrences: [],
    };
  }
  const occurrences = [];
  const report = (el, code, key, summary, hint, values) =>
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary,
        hint,
        i18n: {
          summaryKey: `waiAriaTableIndexes_summary_fail_${key}`,
          hintKey: `waiAriaTableIndexes_hint_fail_${key}`,
          params: Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v)])),
        },
        data: { details: { reasonCode: code, ...values } },
      }),
    );
  // How a message names a cell: its tag, and the start of its text.
  const describeCell = (cell) => {
    const tag = `<${String(dom.localName(cell) || "").toLowerCase()}>`;
    let text = "";
    try {
      text = String((typeof dom.textContent === "function" ? dom.textContent(cell) : cell.textContent) || "").replace(/\s+/g, " ").trim();
    } catch {
      text = "";
    }
    if (text.length > 30) text = `${text.slice(0, 30)}…`;
    return text ? `${tag} "${text}"` : tag;
  };
  for (const table of applicable) {
    const rows = rowsOf.get(table);
    const colcount = intOf(table, "aria-colcount");
    const rowcount = intOf(table, "aria-rowcount");
    let widest = 0;
    // The widest row: its place among the table's rows on the page, and
    // the cell that spans most columns in it.
    let widestRow = 0;
    let widestCell = null;
    let widestCellSpan = 1;
    let previousRow = 0;
    let previousRowAt = 0;
    rows.forEach(({ row, cells }, rowAt) => {
      let previousCol = 0;
      let previousCell = null;
      let previousSpan = 1;
      let span = 0;
      let spanning = null;
      let spanningSpan = 1;
      for (const cell of cells) {
        const colspan = Math.max(1, intOf(cell, "aria-colspan") || intOf(cell, "colspan") || 1);
        if (colspan > spanningSpan) {
          spanning = cell;
          spanningSpan = colspan;
        }
        const colindex = intOf(cell, "aria-colindex");
        if (colindex !== null && colindex >= 1) {
          if (colindex <= previousCol) {
            const earlier = describeCell(previousCell);
            const suggestion = previousCol + previousSpan;
            if (colindex === previousCol) {
              report(cell, "COLINDEX_NOT_INCREASING", "colindexSame",
                `This cell's aria-colindex (${colindex}) is the same as that of the cell before it in its row, ${earlier}.`,
                `Give each cell its own column: if this one comes right after ${earlier}, its aria-colindex is ${suggestion}.`,
                { colindex, previous: previousCol, earlier, suggestion });
            } else {
              report(cell, "COLINDEX_NOT_INCREASING", "colindexBelow",
                `This cell's aria-colindex (${colindex}) is below that of an earlier cell in its row, ${earlier} (${previousCol}).`,
                `Number the cells of each row from left to right, each above the one before: if this one comes right after ${earlier}, its aria-colindex is ${suggestion}.`,
                { colindex, previous: previousCol, earlier, suggestion });
            }
          }
          if (colcount !== null && colcount >= 1 && colindex > colcount) {
            report(cell, "COLINDEX_ABOVE_COUNT", "colindexCount",
              `This cell's aria-colindex (${colindex}) is above the table's aria-colcount (${colcount}).`,
              "Make aria-colcount the number of columns in the full table, or correct the index.",
              { colindex, colcount });
          }
          previousCol = colindex;
          previousCell = cell;
          previousSpan = colspan;
          span = Math.max(span, colindex + colspan - 1);
        } else {
          // A cell without an index compares with none: only the indexes
          // authors give are checked against each other.
          span += colspan;
        }
      }
      if (span > widest) {
        widest = span;
        widestRow = rowAt + 1;
        widestCell = spanning;
        widestCellSpan = spanningSpan;
      }
      const rowindex = intOf(row, "aria-rowindex");
      if (rowindex !== null && rowindex >= 1) {
        if (rowindex <= previousRow) {
          report(row, "ROWINDEX_NOT_INCREASING", "rowindexOrder",
            `This row's aria-rowindex (${rowindex}) is not greater than ${previousRow}, which row ${previousRowAt} of the table on the page gives, before it.`,
            `Number the rows from top to bottom, each above the one before: if this row comes right after row ${previousRowAt}, its aria-rowindex is ${previousRow + 1}.`,
            { rowindex, previous: previousRow, previousPosition: previousRowAt, suggestion: previousRow + 1 });
        }
        if (rowcount !== null && rowcount >= 1 && rowindex > rowcount) {
          report(row, "ROWINDEX_ABOVE_COUNT", "rowindexCount",
            `This row's aria-rowindex (${rowindex}) is above the table's aria-rowcount (${rowcount}).`,
            "Make aria-rowcount the number of rows in the full table, or correct the index.",
            { rowindex, rowcount });
        }
        previousRow = rowindex;
        previousRowAt = rowAt + 1;
      }
    });
    if (colcount !== null && colcount >= 1 && widest > colcount) {
      if (widestCell) {
        const cell = describeCell(widestCell);
        report(table, "COLCOUNT_BELOW_COLUMNS", "colcountSpan",
          `This table's aria-colcount (${colcount}) is below the ${widest} columns that row ${widestRow} of it on the page spans, where ${cell} spans ${widestCellSpan} columns.`,
          `Set aria-colcount to the number of columns in the full table, at least ${widest}, counting the columns a colspan spans, or to -1 if it is not known.`,
          { colcount, columns: widest, row: widestRow, cell, span: widestCellSpan });
      } else {
        report(table, "COLCOUNT_BELOW_COLUMNS", "colcount",
          `This table's aria-colcount (${colcount}) is below the ${widest} columns that row ${widestRow} of it on the page spans.`,
          `Set aria-colcount to the number of columns in the full table, at least ${widest}, or to -1 if it is not known.`,
          { colcount, columns: widest, row: widestRow });
      }
    }
    if (rowcount !== null && rowcount >= 1 && rows.length > rowcount) {
      report(table, "ROWCOUNT_BELOW_ROWS", "rowcount",
        `This table's aria-rowcount (${rowcount}) is below the ${rows.length} rows it has on the page.`,
        `Set aria-rowcount to the number of rows in the full table, at least ${rows.length}, or to -1 if it is not known.`,
        { rowcount, rows: rows.length });
    }
  }
  return {
    ruleId: rule.ruleId,
    outcome: occurrences.length ? "fail" : "pass",
    severity: occurrences.length ? rule.defaultSeverity : "minor",
    occurrences,
  };
}

module.exports = { id, meta, runInPage };
