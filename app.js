const STORAGE_KEY = "gost-forward-rules";
const state = {
  rules: [],
  editingId: null,
};

const dom = {
  form: document.getElementById("rule-form"),
  formTitle: document.getElementById("form-title"),
  submitBtn: document.getElementById("submit-btn"),
  cancelEdit: document.getElementById("cancel-edit"),
  table: document.getElementById("rule-table"),
  commandOutput: document.getElementById("command-output"),
  configOutput: document.getElementById("config-output"),
  exportBtn: document.getElementById("export-btn"),
  importFile: document.getElementById("import-file"),
  copyCommand: document.getElementById("copy-command"),
  copyConfig: document.getElementById("copy-config"),
  name: document.getElementById("name"),
  protocol: document.getElementById("protocol"),
  listen: document.getElementById("listen"),
  target: document.getElementById("target"),
  username: document.getElementById("username"),
  password: document.getElementById("password"),
  tls: document.getElementById("tls"),
  enabled: document.getElementById("enabled"),
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadRules() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) state.rules = parsed;
  } catch (error) {
    console.warn("规则读取失败：", error);
  }
}

function saveRules() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.rules));
}

function resetForm() {
  dom.form.reset();
  dom.enabled.checked = true;
  state.editingId = null;
  dom.formTitle.textContent = "新增规则";
  dom.submitBtn.textContent = "保存规则";
  dom.cancelEdit.hidden = true;
}

function getFormData() {
  return {
    id: state.editingId || uid(),
    name: dom.name.value.trim(),
    protocol: dom.protocol.value,
    listen: dom.listen.value.trim(),
    target: dom.target.value.trim(),
    username: dom.username.value.trim(),
    password: dom.password.value,
    tls: dom.tls.checked,
    enabled: dom.enabled.checked,
  };
}

function fillForm(rule) {
  dom.name.value = rule.name;
  dom.protocol.value = rule.protocol;
  dom.listen.value = rule.listen;
  dom.target.value = rule.target;
  dom.username.value = rule.username || "";
  dom.password.value = rule.password || "";
  dom.tls.checked = Boolean(rule.tls);
  dom.enabled.checked = Boolean(rule.enabled);
  dom.formTitle.textContent = "编辑规则";
  dom.submitBtn.textContent = "更新规则";
  dom.cancelEdit.hidden = false;
}

function buildNode(rule) {
  const auth = rule.username
    ? `://${encodeURIComponent(rule.username)}:${encodeURIComponent(rule.password || "")}@`
    : "://";

  const secure = rule.tls ? "?tls=true" : "";
  return `${rule.protocol}${auth}${rule.listen}/${rule.target}${secure}`;
}

function getEnabledRules() {
  return state.rules.filter((rule) => rule.enabled);
}

function renderOutputs() {
  const enabledRules = getEnabledRules();

  const commands =
    enabledRules.length === 0
      ? "# 暂无启用规则"
      : enabledRules.map((rule) => `gost -L \"${buildNode(rule)}\"`).join("\n");

  const config = {
    services: enabledRules.map((rule) => ({
      name: rule.name,
      addr: rule.listen,
      handler: {
        type: rule.protocol,
        auth: rule.username
          ? {
              username: rule.username,
              password: rule.password || "",
            }
          : undefined,
        metadata: rule.tls ? { tls: true } : undefined,
      },
      listener: {
        type: "tcp",
      },
      forwarder: {
        nodes: [{
          name: `${rule.name}-target`,
          addr: rule.target,
        }],
      },
    })),
  };

  dom.commandOutput.textContent = commands;
  dom.configOutput.textContent = JSON.stringify(config, null, 2);
}

function renderTable() {
  dom.table.innerHTML = "";
  for (const rule of state.rules) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="checkbox" data-action="toggle" data-id="${rule.id}" ${
      rule.enabled ? "checked" : ""
    } /></td>
      <td>${rule.name}</td>
      <td>${rule.protocol}</td>
      <td>${rule.listen}</td>
      <td>${rule.target}</td>
      <td>${rule.tls ? "是" : "否"}</td>
      <td>
        <button data-action="edit" data-id="${rule.id}">编辑</button>
        <button data-action="delete" data-id="${rule.id}">删除</button>
      </td>
    `;
    dom.table.appendChild(row);
  }
  renderOutputs();
}

function upsertRule(rule) {
  const index = state.rules.findIndex((item) => item.id === rule.id);
  if (index === -1) {
    state.rules.unshift(rule);
  } else {
    state.rules[index] = rule;
  }
  saveRules();
  renderTable();
  resetForm();
}

async function copyText(text) {
  if (!text) return;
  await navigator.clipboard.writeText(text);
}

function initializeEvents() {
  dom.form.addEventListener("submit", (event) => {
    event.preventDefault();
    upsertRule(getFormData());
  });

  dom.cancelEdit.addEventListener("click", resetForm);

  dom.table.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const action = target.getAttribute("data-action");
    const id = target.getAttribute("data-id");
    if (!action || !id) return;

    const rule = state.rules.find((item) => item.id === id);
    if (!rule) return;

    if (action === "edit") {
      state.editingId = id;
      fillForm(rule);
    }

    if (action === "delete") {
      state.rules = state.rules.filter((item) => item.id !== id);
      saveRules();
      renderTable();
    }
  });

  dom.table.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.getAttribute("data-action") !== "toggle") return;
    const id = target.getAttribute("data-id");
    const rule = state.rules.find((item) => item.id === id);
    if (!rule) return;
    rule.enabled = target.checked;
    saveRules();
    renderOutputs();
  });

  dom.exportBtn.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state.rules, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `gost-rules-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  });

  dom.importFile.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) {
      throw new Error("导入文件格式错误，必须是数组");
    }
    state.rules = parsed;
    saveRules();
    renderTable();
    dom.importFile.value = "";
  });

  dom.copyCommand.addEventListener("click", async () => {
    await copyText(dom.commandOutput.textContent);
  });

  dom.copyConfig.addEventListener("click", async () => {
    await copyText(dom.configOutput.textContent);
  });
}

loadRules();
initializeEvents();
renderTable();
