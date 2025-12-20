// Simple modal for editing class attributes (vanilla JS)
// Usage: import { openAttributeEditor } from './lib/ui/AttributeEditorModal.js'
// openAttributeEditor({ className, attributes, onSave })

export function openAttributeEditor({
  className = "",
  attributes = [],
  onSave,
  onClose,
} = {}) {
  // clone attributes so we don't modify incoming array directly
  const attrs = Array.isArray(attributes)
    ? attributes.map((a) => ({ ...a }))
    : [];

  const VISIBILITY_OPTIONS = [
    { value: "public", label: "public" },
    { value: "private", label: "private" },
    { value: "protected", label: "protected" },
    { value: "package", label: "package" },
    { value: "none", label: "none" },
  ];

  const overlay = document.createElement("div");
  overlay.className = "abpt-modal-overlay";
  overlay.style.cssText = `position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:10000;background:rgba(0,0,0,0.4);`;

  const modal = document.createElement("div");
  modal.className = "abpt-modal";
  modal.style.cssText = `background:#fff;color:#222;border-radius:6px;max-width:720px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.3);`;

  // Header
  const header = document.createElement("div");
  header.style.cssText =
    "padding:12px 16px;border-bottom:1px solid #eee;font-weight:600;";
  header.textContent = `Edit Attributes of Class ${className}`;
  modal.appendChild(header);

  // Body
  const body = document.createElement("div");
  body.style.cssText = "padding:12px 16px;max-height:60vh;overflow:auto;";

  const table = document.createElement("table");
  table.style.cssText = "width:100%;border-collapse:collapse;font-size:14px;";

  const thead = document.createElement("thead");
  thead.innerHTML = `<tr>
    <th style="text-align:left;padding:6px 8px;width:20%">Visibility</th>
    <th style="text-align:left;padding:6px 8px;width:35%">Name</th>
    <th style="text-align:left;padding:6px 8px;width:35%">Type</th>
    <th style="text-align:left;padding:6px 8px;width:10%">&nbsp;</th>
  </tr>`;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  table.appendChild(tbody);

  body.appendChild(table);
  modal.appendChild(body);

  // Footer with Save/Cancel
  const footer = document.createElement("div");
  footer.style.cssText =
    "padding:10px 16px;border-top:1px solid #eee;display:flex;justify-content:flex-end;gap:8px;";

  const btnCancel = document.createElement("button");
  btnCancel.textContent = "Cancel";
  btnCancel.style.cssText =
    "padding:6px 12px;background:#e2e4df;border:1px solid #ccc;border-radius:4px;cursor:pointer;";

  const btnSave = document.createElement("button");
  btnSave.textContent = "Save";
  btnSave.style.cssText =
    "padding:6px 12px;background:#8fa962;color:#fff;border:0;border-radius:4px;cursor:pointer;";

  footer.appendChild(btnCancel);
  footer.appendChild(btnSave);
  modal.appendChild(footer);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // helper to create input elements for a row
  function createVisibilitySelect(value) {
    const select = document.createElement("select");
    select.style.cssText =
      "width:100%;padding:6px;border:1px solid #ddd;border-radius:4px;";
    VISIBILITY_OPTIONS.forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.label;
      if (opt.value === value) o.selected = true;
      select.appendChild(o);
    });
    return select;
  }

  function createTextInput(value, placeholder) {
    const input = document.createElement("input");
    input.type = "text";
    input.value = value || "";
    input.placeholder = placeholder || "";
    input.style.cssText =
      "width:100%;padding:6px;border:1px solid #ddd;border-radius:4px;";
    return input;
  }

  function createRow(attr = { visibility: "none", name: "", type: "" }) {
    const tr = document.createElement("tr");

    const tdVis = document.createElement("td");
    tdVis.style.padding = "6px 8px";
    const sel = createVisibilitySelect(attr.visibility);
    tdVis.appendChild(sel);

    const tdName = document.createElement("td");
    tdName.style.padding = "6px 8px";
    const nameInput = createTextInput(attr.name, "attribute name");
    tdName.appendChild(nameInput);

    const tdType = document.createElement("td");
    tdType.style.padding = "6px 8px";
    const typeInput = createTextInput(attr.type, "attribute type");
    tdType.appendChild(typeInput);

    const tdAction = document.createElement("td");
    tdAction.style.padding = "6px 8px;text-align:center;";
    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.style.cssText =
      "padding:4px 8px;background:#bf4e54;border:0;color:#fff;border-radius:4px;cursor:pointer;";
    delBtn.addEventListener("click", () => {
      tbody.removeChild(tr);
    });
    tdAction.appendChild(delBtn);

    tr.appendChild(tdVis);
    tr.appendChild(tdName);
    tr.appendChild(tdType);
    tr.appendChild(tdAction);

    return tr;
  }

  // populate existing attributes
  attrs.forEach((a) => tbody.appendChild(createRow(a)));

  // last row: only add-button (spans all columns)
  const addRow = document.createElement("tr");
  const addTd = document.createElement("td");
  addTd.colSpan = 4;
  addTd.style.padding = "8px";
  addTd.style.textAlign = "center";
  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Attribute";
  addBtn.style.cssText =
    "padding:6px 12px;background:#3e646c;color:#fff;border:0;border-radius:4px;cursor:pointer;";
  addBtn.addEventListener("click", () => {
    // insert new editable row before addRow
    const row = createRow({ visibility: "none", name: "", type: "" });
    tbody.insertBefore(row, addRow);
  });
  addTd.appendChild(addBtn);
  addRow.appendChild(addTd);
  tbody.appendChild(addRow);

  function collectAttributes() {
    const rows = Array.from(tbody.querySelectorAll("tr"));
    // ignore the last addRow
    const data = [];
    for (let i = 0; i < rows.length - 1; i++) {
      const r = rows[i];
      const sel = r.cells[0].querySelector("select");
      const name = r.cells[1].querySelector("input").value.trim();
      const type = r.cells[2].querySelector("input").value.trim();
      data.push({ visibility: sel ? sel.value : "none", name, type });
    }
    return data;
  }

  function closeModal() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    if (typeof onClose === "function") onClose();
  }

  btnCancel.addEventListener("click", () => closeModal());

  btnSave.addEventListener("click", () => {
    const data = collectAttributes();
    if (typeof onSave === "function") onSave(data);
    closeModal();
  });

  // close on overlay click (but not when clicking inside modal)
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  // focus first input if present
  requestAnimationFrame(() => {
    const firstInput = tbody.querySelector("input, select");
    if (firstInput) firstInput.focus();
  });

  return {
    close: closeModal,
  };
}

export default openAttributeEditor;
