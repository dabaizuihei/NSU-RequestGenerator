(function () {
  'use strict';

  var STATUS_TEXT = { W: '审批中', A: '审批通过', R: '已驳回' };
  var $ = function (id) { return document.getElementById(id); };

  function defaults() {
    return {
      status: 'W',
      color: 'cyan',
      needReport: true,
      reportStatus: '未销假',
      reportTime: '2026-11-23T09:30',
      name: '王东软',
      no: '11451419198',
      leaveType: '事假',
      walkOut: true,
      cityOut: true,
      provOut: false,
      start: '2026-11-21T08:00',
      end: '2026-11-22T18:00',
      create: '2026-11-20T21:34',
      reason: '导员我今天有点舒服，想请个假',
      location: '四川省成都市都江堰市青城山东软大道1号成都东软学院',
      attachments: [],
      flow: [
        { teacher: '张西软', result: '通过', time: '2026-11-20T21:40', opinion: '' }
      ],
      next: '李南软'
    };
  }

  var state = defaults();

  /* ---------------- helpers ---------------- */
  function fmt(v) {
    if (!v) return '—';
    var m = String(v).replace('T', ' ').match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
    return m ? m[1] + ' ' + m[2] : String(v);
  }
  function diffText() {
    if (!state.start || !state.end) return '0分钟';
    var a = new Date(state.start), b = new Date(state.end);
    if (isNaN(a) || isNaN(b) || b <= a) return '0分钟';
    var mins = Math.round((b - a) / 60000);
    var d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), mm = mins % 60;
    var out = '';
    if (d) out += d + '天';
    if (h) out += h + '小时';
    if (mm) out += mm + '分钟';
    return out || '0分钟';
  }
  // 11/21 08:00 —— 月/日两位、时分两位，短斜杠与波浪线
  function shortDT(v) {
    if (!v) return '--/-- --:--';
    var m = String(v).replace('T', ' ').match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
    return m ? m[2] + '-' + m[3] + ' ' + m[4] + ':' + m[5] : String(v);
  }
  function yn(v, warn) {
    return '<span class="' + (v && warn ? 'text-warning' : '') + '">' + (v ? '是' : '否') + '</span>';
  }

  /* ---------------- render preview ---------------- */
  function render() {
    var banner = $('banner');
    banner.className = 'full-width text-center text-white q-card__section q-card__section--vert bg-' + state.color;

    var statusText = STATUS_TEXT[state.status];
    var iconName = state.status === 'A' ? 'done' : 'clear';

    if (state.needReport) {
      $('bannerLine1').classList.remove('hidden');
      $('bannerStatusSmall').textContent = statusText;
      var i1 = $('bannerIcon');
      i1.textContent = iconName;
      i1.style.display = state.status === 'W' ? 'none' : '';
      $('bannerBigIcon').classList.add('hidden');
      $('bannerBig').textContent = state.reportStatus;
      $('bannerReportTime').textContent = state.reportStatus === '已销假' ? ' (' + shortDT(state.reportTime) + ')' : '';
    } else {
      $('bannerLine1').classList.add('hidden');
      var i2 = $('bannerBigIcon');
      i2.classList.remove('hidden');
      i2.textContent = iconName;
      i2.style.display = state.status === 'W' ? 'none' : '';
      $('bannerBig').textContent = statusText;
      $('bannerReportTime').textContent = '';
    }

    $('v-type').textContent = state.leaveType;
    $('v-walkout').innerHTML = yn(state.walkOut, true);
    $('v-cityout').innerHTML = yn(state.cityOut, true);
    $('v-provout').innerHTML = yn(state.provOut, true);
    $('v-student').textContent = state.name + '(' + state.no + ')';

    $('v-time').textContent = diffText() + '(' + shortDT(state.start) + '~' + shortDT(state.end) + ')';
    $('v-create').textContent = fmt(state.create);
    $('v-reason').textContent = state.reason || '—';
    if ($('f-duration')) $('f-duration').value = diffText();

    var locRow = $('rowLocation');
    if (state.location) {
      locRow.classList.remove('hidden');
      $('v-location').textContent = state.location;
    } else {
      locRow.classList.add('hidden');
    }

    var attRow = $('rowAttachment');
    if (state.attachments.length) {
      attRow.classList.remove('hidden');
      $('v-attachments').innerHTML = state.attachments.map(function (a) {
        return '<img src="' + a.src + '" alt="' + (a.name || '') + '">';
      }).join('');
    } else {
      attRow.classList.add('hidden');
    }

    renderTimeline();
    renderChrome();
  }

  function renderTimeline() {
    var html = [];
    html.push(entry(fmt(state.create), 'text-grey',
      esc(state.name) + ' - 发起申请'));

    var total = state.flow.length;
    state.flow.forEach(function (f, i) {
      var dot = 'text-grey';
      var last = i === total - 1;
      if (state.status !== 'W' && last) {
        dot = (state.status === 'R' || f.result === '驳回') ? 'text-red' : 'text-positive';
      }
      var resultText = f.result === '通过' ? '审批通过' : '审批驳回';
      if (state.status !== 'W' && last) resultText = state.status === 'R' ? '审批驳回' : '审批通过';
      var text = esc(f.teacher || '审批人') + ' - ' + resultText;
      var opinion = f.opinion ? '<p style="font-size:11px">审批意见：' + esc(f.opinion) + '</p>' : '';
      html.push(entry(fmt(f.time), dot, text + opinion));
    });

    if (state.status === 'W') {
      var names = (state.next || '').split(/[,，、]/).map(function (s) { return s.trim(); }).filter(Boolean);
      if (names.length) {
        var shown = names.slice(0, 3).map(esc).join(', ');
        var more = names.length > 3 ? '等' + names.length + '人审核中' : '';
        html.push(entry('当前审核教师', 'text-warning', shown + more));
      }
    }

    if (state.reportStatus === '已销假' && state.reportTime) {
      html.push(entry(shortDT(state.reportTime), 'text-grey', esc(state.name) + ' - 销假成功'));
    }

    $('timeline').innerHTML = html.join('');
  }

  function entry(sub, dot, content) {
    return '<li class="q-timeline__entry q-timeline__entry--right">' +
      '<div class="q-timeline__subtitle"><span>' + esc(sub) + '</span></div>' +
      '<div class="q-timeline__dot ' + dot + '"></div>' +
      '<div class="q-timeline__content"><h6 class="q-timeline__title"></h6>' + content + '</div>' +
      '</li>';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderChrome() {
    $('phDelete').style.display = state.status === 'W' ? '' : 'none';
    var footer = $('pf');
    var appview = $('appview');
    if (state.status === 'A') {
      footer.classList.add('is-on');
      appview.classList.add('has-footer');
      var showReportBtn = state.needReport && state.reportStatus !== '已销假';
      var qr = $('pfQr'), rep = $('pfReport');
      if (showReportBtn) {
        rep.style.display = '';
        qr.style.width = '60%';
        rep.style.width = '40%';
      } else {
        rep.style.display = 'none';
        qr.style.width = '100%';
      }
    } else {
      footer.classList.remove('is-on');
      appview.classList.remove('has-footer');
    }
  }

  /* ---------------- editor binding ---------------- */
  var map = {
    'f-status': function (v) {
      state.status = v;
      state.color = { W: 'cyan', A: 'green', R: 'red' }[v] || state.color;
      syncNeedReportRule();
    },
    'f-name': function (v) { state.name = v; },
    'f-no': function (v) { state.no = v; },
    'f-leavetype': function (v) { state.leaveType = v; },
    'f-start': function (v) { state.start = v; },
    'f-end': function (v) { state.end = v; },
    'f-create': function (v) { state.create = v; },
    'f-reason': function (v) { state.reason = v; },
    'f-location': function (v) { state.location = v; },
    'f-reportstatus': function (v) { state.reportStatus = v; },
    'f-reporttime': function (v) { state.reportTime = v; },
    'f-next': function (v) { state.next = v; }
  };

  Object.keys(map).forEach(function (id) {
    var el = $(id);
    if (!el) return;
    el.addEventListener('input', function () { map[id](el.value); afterEdit(); });
    el.addEventListener('change', function () { map[id](el.value); afterEdit(); });
  });

  $('f-needreport').addEventListener('change', function () { state.needReport = this.checked; afterEdit(); });
  $('f-walkout').addEventListener('change', function () { state.walkOut = this.checked; afterEdit(); });
  $('f-cityout').addEventListener('change', function () { state.cityOut = this.checked; afterEdit(); });
  $('f-provout').addEventListener('change', function () { state.provOut = this.checked; afterEdit(); });

  function syncNeedReportRule() {
    var canReport = state.status === 'A';
    var cb = $('f-needreport');
    if (!canReport) {
      state.needReport = false;
      if (state.reportStatus === '已销假') state.reportStatus = '未销假';
      if ($('f-reportstatus')) $('f-reportstatus').value = state.reportStatus;
    } else if (!state.needReport) {
      state.needReport = true;
    }
    if (cb) {
      cb.checked = state.needReport;
      cb.disabled = !canReport;
      var row = $('wrap-needreport') || cb.closest('.field--switch');
      if (row) row.style.display = canReport ? '' : 'none';
    }
  }

  function afterEdit() {
    $('wrap-reportstatus').style.display = state.needReport ? '' : 'none';
    $('wrap-reporttime').style.display = (state.needReport && state.reportStatus === '已销假') ? '' : 'none';
    $('wrap-next').style.display = state.status === 'W' ? '' : 'none';
    render();
  }

  /* ---------------- flow editor ---------------- */
  function buildFlow() {
    var box = $('flowList');
    box.innerHTML = '';
    state.flow.forEach(function (f, i) {
      var row = document.createElement('div');
      row.className = 'flow-row';
      row.innerHTML =
        '<div class="row-head"><strong>节点 ' + (i + 1) + '</strong>' +
        '<button type="button" class="del" data-i="' + i + '">删除</button></div>' +
        '<div class="mini">' +
        '<div class="f"><label>审批人</label><input type="text" data-k="teacher" data-i="' + i + '" value="' + escAttr(f.teacher) + '"></div>' +
        '<div class="f"><label>结果</label><select data-k="result" data-i="' + i + '">' +
        '<option value="通过"' + (f.result === '通过' ? ' selected' : '') + '>通过</option>' +
        '<option value="驳回"' + (f.result === '驳回' ? ' selected' : '') + '>驳回</option></select></div>' +
        '<div class="f"><label>审批时间</label><input type="datetime-local" data-k="time" data-i="' + i + '" value="' + escAttr(f.time) + '"></div>' +
        '<div class="f"><label>审批意见</label><input type="text" data-k="opinion" data-i="' + i + '" value="' + escAttr(f.opinion) + '"></div>' +
        '</div>';
      box.appendChild(row);
    });

    Array.prototype.forEach.call(box.querySelectorAll('[data-k]'), function (el) {
      var handler = function () {
        var i = +el.dataset.i;
        state.flow[i][el.dataset.k] = el.value;
        render();
      };
      el.addEventListener('input', handler);
      el.addEventListener('change', handler);
    });
    Array.prototype.forEach.call(box.querySelectorAll('.del'), function (el) {
      el.addEventListener('click', function () {
        state.flow.splice(+el.dataset.i, 1);
        buildFlow();
        render();
      });
    });
  }
  function escAttr(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

  $('addFlow').addEventListener('click', function () {
    state.flow.push({ teacher: '新审批人', result: '通过', time: '', opinion: '' });
    buildFlow();
    render();
  });

  /* ---------------- attachments ---------------- */
  $('pickFiles').addEventListener('click', function () { $('f-files').click(); });
  $('f-files').addEventListener('change', function () {
    var files = Array.prototype.slice.call(this.files || []);
    var pending = files.length;
    if (!pending) return;
    files.forEach(function (file) {
      var reader = new FileReader();
      reader.onload = function () {
        state.attachments.push({ name: file.name, src: reader.result });
        buildFiles();
        render();
      };
      reader.readAsDataURL(file);
    });
    this.value = '';
  });

  function buildFiles() {
    var box = $('fileList');
    box.innerHTML = state.attachments.map(function (a, i) {
      return '<div class="file-item"><img src="' + a.src + '" alt="">' +
        '<button type="button" data-i="' + i + '" title="移除">×</button>' +
        '<span>' + esc(a.name) + '</span></div>';
    }).join('');
    Array.prototype.forEach.call(box.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () {
        state.attachments.splice(+b.dataset.i, 1);
        buildFiles();
        render();
      });
    });
  }

  /* ---------------- inputs sync ---------------- */
  function syncInputs() {
    $('f-status').value = state.status;
    $('f-name').value = state.name;
    $('f-no').value = state.no;
    $('f-leavetype').value = state.leaveType;
    $('f-start').value = state.start;
    $('f-end').value = state.end;
    $('f-create').value = state.create;
    $('f-reason').value = state.reason;
    $('f-location').value = state.location;
    $('f-reportstatus').value = state.reportStatus;
    $('f-reporttime').value = state.reportTime;
    $('f-next').value = state.next;
    $('f-walkout').checked = state.walkOut;
    $('f-cityout').checked = state.cityOut;
    $('f-provout').checked = state.provOut;
    var cb = $('f-needreport');
    cb.checked = state.needReport;
    syncNeedReportRule();
  }

  /* ---------------- font ---------------- */
  var fontSel = $('fontSel');
  var FONT_CLASS = { phone: '', ios: 'font-ios', android: 'font-android', han: 'font-han' };
  function applyFont(v) {
    document.body.classList.remove('font-ios', 'font-android', 'font-han');
    if (FONT_CLASS[v]) document.body.classList.add(FONT_CLASS[v]);
    if (fontSel) fontSel.value = v;
    try { localStorage.setItem('wisestu.font', v); } catch (e) {}
  }
  if (fontSel) {
    var savedFont = null;
    try { savedFont = localStorage.getItem('wisestu.font'); } catch (e) {}
    applyFont(savedFont && FONT_CLASS.hasOwnProperty(savedFont) ? savedFont : 'phone');
    fontSel.addEventListener('change', function () { applyFont(this.value); });
  }

  /* ---------------- 全屏预览（页内铺满，不调用浏览器全屏） ---------------- */
  var fsRoot = $('fsRoot'), fsBody = $('fsBody');
  function buildFsContent() {
    if (!fsBody) return;
    var wrap = document.createElement('div');
    wrap.className = 'fs-app';
    var parts = [];
    var appview = $('appview'), ph = $('ph'), pf = $('pf');
    if (appview) parts.push(appview.outerHTML);
    if (ph) parts.push(ph.outerHTML);
    if (pf) parts.push(pf.outerHTML);
    wrap.innerHTML = parts.join('');
    fsBody.innerHTML = '';
    fsBody.appendChild(wrap);
    // 绑定左上角返回按钮 → 退出全屏
    var backBtn = wrap.querySelector('.ph .q-btn--round');
    if (backBtn) {
      backBtn.style.cursor = 'pointer';
      backBtn.addEventListener('click', closeFs);
    }
  }
  function openFs() {
    if (!fsRoot) return;
    buildFsContent();
    fsRoot.hidden = false;
    fsRoot.classList.add('is-open');
  }
  function closeFs() {
    if (!fsRoot) return;
    fsRoot.classList.remove('is-open');
    fsRoot.hidden = true;
  }
  if ($('btnFs')) $('btnFs').addEventListener('click', openFs);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && fsRoot && !fsRoot.hidden) closeFs();
  });

  /* ---------------- preview scaling ---------------- */
  var stage = $('stage'), phone = $('phone');
  var DEV_W = 390;
  function fit() {
    var box = stage.getBoundingClientRect();
    var availH = box.height - 18, availW = box.width - 24;
    var s = Math.min(1, availH / 862, availW / (DEV_W + 18));
    phone.style.zoom = Math.max(s, 0.4);
  }
  window.addEventListener('resize', fit);

  /* ---------------- init ---------------- */
  syncInputs();
  buildFlow();
  buildFiles();
  fit();
  afterEdit();
})();
