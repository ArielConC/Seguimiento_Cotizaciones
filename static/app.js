
function formatWebUrl(raw) {
  if (!raw) return '';
  raw = String(raw).trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return 'https://' + raw;
}


function getCompanyLogoUrl(contact) {
  let domain = '';
  if (contact.sitio_web) {
    domain = contact.sitio_web.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].split(':')[0].trim();
  }
  if (!domain && contact.correo) {
    const parts = contact.correo.split('@');
    if (parts.length > 1) {
      const emailDomain = parts[1].toLowerCase().trim();
      const generic = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'icloud.com', 'live.com', 'aol.com', 'prodigy.net.mx'];
      if (!generic.includes(emailDomain)) {
        domain = emailDomain;
      }
    }
  }
  if (domain && domain.includes('.')) {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
  }
  return '';
}

const state={me:null,system:null,view:'management',quote:null,language:'en',importToken:null,bootstrap:false,users:[],calendar:null};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=(v='')=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

const I18N={
  en:{sales_followup:'Sales follow-up',dashboard:'Dashboard',priorities:'SABC Priorities',managed:'Managed',safe:'Safe',po_missing:'PO Date Missing',lost:'Lost',archive:'Archive',historical:'Historical',reports:'Reports',users:'Users',quotation_management:'QUOTATION MANAGEMENT',agent:'NT Tool agent',language:'Language',upload_excel:'Upload Excel / TXT',logout:'Log out',change_password:'Change password',current_password:'Current password',new_password:'New password',pending_total:'Pending quotation total',in_followup:'IN FOLLOW-UP',priority_distribution:'Priority distribution',daily_report:'DAILY REPORT',today_activity:"Today's activity",generate_daily:'Generate daily report',attention:'ATTENTION',priority_quotes:'Priority quotations',view_all:'View all',search:'Search',priority:'Priority',sort_by:'Sort by',period_activity:'Quotation activity by period',report_help:'The report counts newly imported quotations, saved Manage reviews, status changes, losses, and PO conversions for the selected period.',daily:'Daily',weekly:'Weekly',monthly:'Monthly',custom:'Custom range',start_date:'Start date',end_date:'End date',scope:'Scope',generate_report:'Generate report',user_admin:'USER ADMINISTRATION',create_user:'Create user',display_name:'Display name',role:'Role',temporary_password:'Temporary password',generate_password:'Generate temporary password',temporary_password_help:'Copy the password before saving. The user will be asked to replace it at the next login.',recent_audit:'Recent audit activity',select_workspace:'SELECT WORKSPACE',choose_system:'Choose a follow-up system',standard_help:'USD quotations imported from the daily Excel or TXT report.',special_help:'Special items in JPY with percentile-based priorities.',import_data:'IMPORT DATA',cancel:'Cancel',preview:'Preview',confirm_import:'Confirm import',update_followup:'UPDATE FOLLOW-UP',status:'Status',followup_method:'Follow-up method',loss_reason:'Loss reason',po_date:'PO date',mark_safe:'Mark as Safe',new_comment:'New comment',comment_history:'Comment history',save_review:'Save review',operation_details:'OPERATION DETAILS',audit_history:'Activity history',edit_user:'Edit user',active:'Active',reset_password:'Reset password',save:'Save',all_agents:'All agents',pending:'Pending',view:'View',manage:'Manage',restore:'Restore',added_today:'Added today',po_today:'PO today',overdue:'Overdue follow-ups',po_date_missing:'PO date missing',quotations:'quotations',quoted_total:'Quoted total',po_total:'PO total',grand_total:'Pending + PO total',backup_ok:'Backup verified',backup_due:'Backup overdue or missing',no_records:'No quotations match this view.',read_only:'Read-only historical data',import_complete:'Import completed',all_team:'All team',my_activity:'My activity',new:'New',updated:'Updated',unchanged:'Unchanged',duplicates:'Duplicates',invalid:'Invalid',excluded:'Archived / hidden',rows:'Rows',details:'Details',end_user:'End User',company:'Distributor',net_total:'Net internal total',order:'Customer order',method:'Method',last_review:'Last review',days:'days',rank:'Rank',model:'Model',quantity:'Quantity',unit_price:'Unit price',reason:'Loss reason',date:'Date',reference:'Quotation',nt_agent:'NT Tool agent',dist_agent:'Distributor agent',no_comments:'No comments have been saved.',no_activity:'No activity has been recorded.',reviewed:'Reviewed',status_changes:'Status changes',converted_po:'Converted to PO',lost_quotes:'Lost quotations',financial_summary:'Financial summary',loss_breakdown:'Loss reasons',po_comparison:'QT versus PO',signin:'Sign in',initial_setup:'Initial setup: choose takujiyamada or ignacioillescas and create the first password.',password:'Password',username:'Username',po_invoices:'PO invoices',po_invoices_help:'Add every invoice that forms this PO. The total and PO date are calculated automatically.',add_invoice:'+ Add invoice',invoice_date:'Invoice date',invoice_series:'Series / folio',invoice_number:'Invoice number / code',invoice_amount:'Invoice amount',remove:'Remove',invoices:'Invoices',hide_navigation:'Hide navigation',show_navigation:'Show navigation',management:'Management',period:'Period',all_history:'All history',today:'Today',current_month:'Current month',fiscal_year:'Fiscal year',all:'All',distributor_code:'Distributor code',quote_age:'Days open',last_activity:'Last activity',initial_import:'Initial import',stale_question:'This quotation has a high probability of being lost because it is more than 60 days old. Review its status during this follow-up.',color_legend:'Row colors',no_code:'No code',clear_filters:'Clear filters',upload_invoices:'Upload invoices',invoice_import_help:'Invoices from Excel or TXT are matched through Texto Extra 2 only to quotations in PO Date Missing.'},
  es:{sales_followup:'Seguimiento de ventas',dashboard:'Resumen',priorities:'Prioridades SABC',managed:'Gestionadas',safe:'Seguras',po_missing:'PO sin fecha',lost:'Perdidas',archive:'Archivo',historical:'Históricas',reports:'Reportes',users:'Usuarios',quotation_management:'GESTIÓN DE COTIZACIONES',agent:'Agente NT Tool',language:'Idioma',upload_excel:'Subir Excel',logout:'Cerrar sesión',change_password:'Cambiar contraseña',current_password:'Contraseña actual',new_password:'Nueva contraseña',pending_total:'Total de cotizaciones pendientes',in_followup:'EN SEGUIMIENTO',priority_distribution:'Distribución por prioridad',daily_report:'REPORTE DIARIO',today_activity:'Actividad de hoy',generate_daily:'Generar reporte diario',attention:'ATENCIÓN',priority_quotes:'Cotizaciones prioritarias',view_all:'Ver todas',search:'Buscar',priority:'Prioridad',sort_by:'Ordenar por',period_activity:'Actividad de cotizaciones por periodo',report_help:'El reporte cuenta cotizaciones nuevas importadas, revisiones guardadas en Manage, cambios de estado, pérdidas y conversiones a PO del periodo seleccionado.',daily:'Diario',weekly:'Semanal',monthly:'Mensual',custom:'Rango personalizado',start_date:'Fecha inicial',end_date:'Fecha final',scope:'Alcance',generate_report:'Generar reporte',user_admin:'ADMINISTRACIÓN DE USUARIOS',create_user:'Crear usuario',display_name:'Nombre visible',role:'Rol',temporary_password:'Contraseña temporal',generate_password:'Generar contraseña temporal',temporary_password_help:'Copia la contraseña antes de guardar. El usuario deberá reemplazarla al iniciar sesión.',recent_audit:'Actividad reciente de auditoría',select_workspace:'SELECCIONAR ESPACIO',choose_system:'Elige un sistema de seguimiento',standard_help:'Cotizaciones en USD importadas desde el Excel diario.',special_help:'Artículos especiales en JPY con prioridades por percentiles.',import_data:'IMPORTAR DATOS',cancel:'Cancelar',preview:'Vista previa',confirm_import:'Confirmar importación',update_followup:'ACTUALIZAR SEGUIMIENTO',status:'Estado',followup_method:'Método de seguimiento',loss_reason:'Motivo de pérdida',po_date:'Fecha de PO',mark_safe:'Marcar como segura',new_comment:'Nuevo comentario',comment_history:'Historial de comentarios',save_review:'Guardar revisión',operation_details:'DETALLES DE LA OPERACIÓN',audit_history:'Historial de actividad',edit_user:'Editar usuario',active:'Activo',reset_password:'Restablecer contraseña',save:'Guardar',all_agents:'Todos los agentes',pending:'Pendiente',view:'Ver',manage:'Gestionar',restore:'Restaurar',added_today:'Agregadas hoy',po_today:'PO de hoy',overdue:'Seguimientos vencidos',po_date_missing:'PO sin fecha',quotations:'cotizaciones',quoted_total:'Total cotizado',po_total:'Total de PO',grand_total:'Total pendiente + PO',backup_ok:'Respaldo verificado',backup_due:'Respaldo vencido o inexistente',no_records:'No hay cotizaciones en esta vista.',read_only:'Datos históricos de solo lectura',import_complete:'Importación completada',all_team:'Todo el equipo',my_activity:'Mi actividad',new:'Nuevas',updated:'Actualizadas',unchanged:'Sin cambios',duplicates:'Duplicadas',invalid:'Inválidas',excluded:'Archivadas / ocultas',rows:'Filas',details:'Detalles',end_user:'Usuario final',company:'Distribuidor',net_total:'Total neto interno',order:'Orden del cliente',method:'Método',last_review:'Última revisión',days:'días',rank:'Rango',model:'Modelo',quantity:'Cantidad',unit_price:'Precio unitario',reason:'Motivo de pérdida',date:'Fecha',reference:'Cotización',nt_agent:'Agente NT Tool',dist_agent:'Agente distribuidor',no_comments:'No se han guardado comentarios.',no_activity:'No se ha registrado actividad.',reviewed:'Revisadas',status_changes:'Cambios de estado',converted_po:'Convertidas a PO',lost_quotes:'Cotizaciones perdidas',financial_summary:'Resumen financiero',loss_breakdown:'Motivos de pérdida',po_comparison:'Comparación QT contra PO',signin:'Entrar',initial_setup:'Configuración inicial: selecciona takujiyamada o ignacioillescas y crea la primera contraseña.',password:'Contraseña',username:'Usuario',po_invoices:'Facturas de la PO',po_invoices_help:'Agrega todas las facturas que componen esta PO. El total y la fecha de PO se calculan automáticamente.',add_invoice:'+ Agregar factura',invoice_date:'Fecha de factura',invoice_series:'Serie / folio',invoice_number:'Número / código de factura',invoice_amount:'Importe de factura',remove:'Eliminar',invoices:'Facturas',hide_navigation:'Ocultar navegación',show_navigation:'Mostrar navegación',management:'Gerencia',period:'Periodo',all_history:'Todo el historial',today:'Hoy',current_month:'Mes actual',fiscal_year:'Año fiscal',all:'Todos',distributor_code:'Código distribuidor',quote_age:'Días abierta',last_activity:'Última actividad',initial_import:'Alta inicial',stale_question:'Esta cotización tiene alta probabilidad de pérdida porque tiene más de 60 días. Revisa su estado durante este seguimiento.',color_legend:'Colores de seguimiento',no_code:'Sin código',clear_filters:'Limpiar filtros',upload_invoices:'Subir facturas',invoice_import_help:'Las facturas se relacionan mediante Texto Extra 2 únicamente con cotizaciones de PO sin fecha.'},
  ja: {sales_followup:'営業フォローアップ',dashboard:'ダッシュボード',priorities:'優先度 SABC',managed:'対応済み',safe:'安全 (Safe)',po_missing:'PO 日付なし',lost:'失注 (Lost)',archive:'アーカイブ',historical:'履歴データ',reports:'レポート',users:'ユーザー',quotation_management:'見積管理',agent:'NT担当者',language:'言語',upload_excel:'Excelアップロード',logout:'ログアウト',change_password:'パスワード変更',current_password:'現在のパスワード',new_password:'新しいパスワード',pending_total:'保留中の見積合計',in_followup:'フォローアップ中',priority_distribution:'優先度分布',daily_report:'日報',today_activity:'今日の活動',generate_daily:'日報を作成',attention:'要注意',priority_quotes:'優先見積',view_all:'すべて表示',search:'検索',priority:'優先度',sort_by:'並べ替え',period_activity:'期間別の見積活動',report_help:'選択した期間の新規見積、保存されたレビュー、ステータス変更、失注、PO変換をカウントします。',daily:'日次',weekly:'週次',monthly:'月次',custom:'カスタム範囲',start_date:'開始日',end_date:'終了日',scope:'範囲',generate_report:'レポート作成',user_admin:'ユーザー管理',create_user:'ユーザー作成',display_name:'表示名',role:'役割',temporary_password:'一時パスワード',generate_password:'一時パスワード生成',temporary_password_help:'保存する前にパスワードをコピーしてください。',recent_audit:'最近の監査活動',select_workspace:'ワークスペース選択',choose_system:'システムを選択',standard_help:'日次ExcelからインポートされたUSD見積。',special_help:'パーセンタイルベースの優先度を持つJPYの特別アイテム。',import_data:'データインポート',cancel:'キャンセル',preview:'プレビュー',confirm_import:'インポート確認',update_followup:'フォローアップ更新',status:'ステータス',followup_method:'フォローアップ方法',loss_reason:'失注理由',po_date:'PO日付',mark_safe:'安全(Safe)にマーク',new_comment:'新規コメント',comment_history:'コメント履歴',save_review:'レビューを保存',operation_details:'操作詳細',audit_history:'活動履歴',edit_user:'ユーザー編集',active:'有効',reset_password:'パスワードリセット',save:'保存',all_agents:'すべての担当者',pending:'保留中',view:'表示',manage:'管理',restore:'復元',added_today:'本日追加',po_today:'本日のPO',overdue:'期限切れのフォローアップ',po_date_missing:'PO日付なし',quotations:'件',quoted_total:'見積合計',po_total:'PO合計',grand_total:'保留中 + PO合計',backup_ok:'バックアップ確認済み',backup_due:'バックアップ期限切れ',no_records:'データがありません。',read_only:'読み取り専用の履歴データ',import_complete:'インポート完了',all_team:'全チーム',my_activity:'自分の活動',new:'新規',updated:'更新済み',unchanged:'変更なし',duplicates:'重複',invalid:'無効',excluded:'除外 / 非表示',rows:'行',details:'詳細',end_user:'エンドユーザー',company:'代理店',net_total:'社内純合計',order:'顧客注文',method:'方法',last_review:'最終レビュー',days:'日',rank:'ランク',model:'モデル',quantity:'数量',unit_price:'単価',reason:'失注理由',date:'日付',reference:'見積番号',nt_agent:'NT担当者',dist_agent:'代理店担当者',no_comments:'コメントはありません。',no_activity:'活動記録はありません。',reviewed:'レビュー済み',status_changes:'ステータス変更',converted_po:'PO変換',lost_quotes:'失注見積',financial_summary:'財務概要',loss_breakdown:'失注理由の内訳',po_comparison:'見積 vs PO',signin:'サインイン',initial_setup:'初期設定',password:'パスワード',username:'ユーザー名',po_invoices:'POの請求書',po_invoices_help:'このPOの請求書を追加します。合計と日付は自動計算されます。',add_invoice:'+ 請求書追加',invoice_date:'請求日',invoice_series:'シリーズ / フォリオ',invoice_number:'請求書番号 / コード',invoice_amount:'請求額',remove:'削除',invoices:'請求書',hide_navigation:'ナビゲーション非表示',show_navigation:'ナビゲーション表示',management:'管理 (Management)',period:'期間',all_history:'全履歴',today:'今日',current_month:'今月',fiscal_year:'会計年度',all:'すべて',distributor_code:'代理店コード',quote_age:'経過日数',last_activity:'最終活動',initial_import:'初回インポート',stale_question:'この見積は90日以上経過しています。失注しましたか？',color_legend:'行の色の凡例',no_code:'コードなし'}
};
I18N.en.standard_help='USD quotations imported from the daily Excel or TXT report.';
I18N.es.standard_help='Cotizaciones en USD importadas desde el reporte diario Excel o TXT.';
I18N.ja.standard_help='日次のExcelまたはTXTレポートからインポートされたUSD見積。';
I18N.en.upload_excel='Upload Excel / TXT';
I18N.es.upload_excel='Subir Excel / TXT';
I18N.ja.upload_excel='Excel / TXTアップロード';
I18N.en.invoice_import_help='Invoices from Excel or TXT are matched through Texto Extra 2.';
I18N.es.invoice_import_help='Las facturas de Excel o TXT se relacionan mediante Texto Extra 2.';
I18N.ja.invoice_import_help='ExcelまたはTXTの請求書はTexto Extra 2で照合されます。';
const MONTHLY_I18N={
  en:{monthly_report:'Monthly Report',monthly_activity:'Follow-up activity by management date',monthly_help:'This mode uses the date each user saved a Manage follow-up, not the quotation date. Initial imports are excluded.',managing_user:'Managing user',all_users:'All users',result:'Result',managed_quotes:'Managed quotations',responded:'Responded',no_response:'No response',awaiting_response:'Awaiting response',apply_filters:'Apply filters',saved_activities:'saved activities',assigned_agent:'Assigned NT agent',change_made:'Change made',activity_by:'Managed by'},
  es:{monthly_report:'Reporte mensual',monthly_activity:'Actividad de seguimiento por fecha de gestión',monthly_help:'Este modo usa la fecha en que cada usuario guardó un seguimiento en Gestionar, no la fecha de la cotización. Las altas iniciales quedan excluidas.',managing_user:'Usuario gestor',all_users:'Todos los usuarios',result:'Resultado',managed_quotes:'Cotizaciones gestionadas',responded:'Hubo respuesta',no_response:'Sin respuesta',awaiting_response:'En espera',apply_filters:'Aplicar filtros',saved_activities:'gestiones guardadas',assigned_agent:'Agente NT asignado',change_made:'Cambio realizado',activity_by:'Gestionada por'},
  ja:{monthly_report:'月次レポート',monthly_activity:'管理日別フォローアップ活動',monthly_help:'見積日ではなく、各ユーザーが管理画面でフォローアップを保存した日付を使用します。初回インポートは除外されます。',managing_user:'管理ユーザー',all_users:'すべてのユーザー',result:'結果',managed_quotes:'管理済み見積',responded:'回答あり',no_response:'回答なし',awaiting_response:'回答待ち',apply_filters:'フィルター適用',saved_activities:'保存された活動',assigned_agent:'割り当てNT担当者',change_made:'変更内容',activity_by:'管理者',clear_filters:'フィルターをクリア'},
};
const t=k=>MONTHLY_I18N[state.language]?.[k]||I18N[state.language]?.[k]||MONTHLY_I18N.en[k]||I18N.en[k]||k;
const currency=()=>state.system==='special'?'JPY':'USD';
const locale=()=>state.language==='es'?'es-MX':state.language==='ja'?'ja-JP':'en-US';
const money=v=>new Intl.NumberFormat(locale(),{style:'currency',currency:currency(),maximumFractionDigits:currency()==='JPY'?0:2}).format(Number(v||0));
const fmtDate=v=>v?new Intl.DateTimeFormat(locale(),{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(`${v}T12:00:00`)):'—';
const fmtDT=v=>v?new Intl.DateTimeFormat(locale(),{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'America/Mexico_City'}).format(new Date(v)):'—';
const prefix=()=>state.system==='special'?'/api/special':'/api';
const isoLocal=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const businessToday=()=>new Date(`${state.calendar?.today||isoLocal(new Date())}T12:00:00`);

function dashboardRange(){
  const kind=$('#dashboard-period').value;
  const today=businessToday();
  let start='';let end='';
  if(kind==='today')start=end=state.calendar?.today||isoLocal(today);
  if(kind==='month'){start=state.calendar?.month_start||isoLocal(new Date(today.getFullYear(),today.getMonth(),1));end=state.calendar?.today||isoLocal(today);}
  if(kind==='fiscal'){start=state.calendar?.fiscal_start||isoLocal(new Date(today.getFullYear(),3,1));end=state.calendar?.today||isoLocal(today);}
  if(kind==='custom'){start=$('#dashboard-start').value;end=$('#dashboard-end').value;}
  if(start&&end&&end<start)throw new Error(state.language==='es'?'La fecha final no puede ser anterior a la inicial.':'End date cannot be before start date.');
  return {kind,start,end};
}
function dashboardQuery(extra={}){
  const {start,end}=dashboardRange();
  const params=new URLSearchParams({agent:$('#global-agent').value,...extra});
  if(start&&end){params.set('start',start);params.set('end',end);}
  return params;
}
function refreshPeriodControls(){
  const {kind,start,end}=dashboardRange();
  const custom=kind==='custom';
  $('#dashboard-start-wrap').classList.toggle('hidden',!custom);
  $('#dashboard-end-wrap').classList.toggle('hidden',!custom);
  $('#dashboard-period-label').textContent=kind==='all'?t('all_history'):(start&&end?`${fmtDate(start)} – ${fmtDate(end)}`:'');
}

async function api(path,options={}){
  const headers={'Content-Type':'application/json',...(options.headers||{})};
  if(state.me?.csrf_token) headers['X-CSRF-Token']=state.me.csrf_token;
  const response=await fetch(path,{...options,headers});
  const body=await response.json().catch(()=>({}));
  if(response.status===401&&state.me){state.me=null;showLogin(false);}
  if(!response.ok) throw new Error(body.error||(response.status?`Error del servidor (${response.status} ${response.statusText})`:'Error de conexi\u00f3n con el servidor'));
  return body;
}
function toast(message,error=false){const box=$('#toast');box.textContent=message;box.className=`toast show${error?' error':''}`;clearTimeout(toast.timer);toast.timer=setTimeout(()=>box.className='toast',4500);}
function applyLanguage(){
  document.documentElement.lang=state.language;
  $$('[data-i18n]').forEach(el=>{
    const translated=t(el.dataset.i18n);
    const control=el.matches('label')?el.querySelector(':scope > input, :scope > select, :scope > textarea'):null;
    if(!control){el.textContent=translated;return;}
    let caption=el.querySelector(':scope > .i18n-caption');
    if(!caption){
      caption=document.createElement('span');
      caption.className='i18n-caption';
      [...el.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).forEach(node=>node.remove());
      el.insertBefore(caption,control);
    }
    caption.textContent=translated;
  });
  $('#language-select').value=state.language;
  $('#report-scope').options[0].text=t('my_activity');
  $('#report-scope').options[1].text=t('all_team');
  updateSidebarButton();
  renderLegend();
  refreshPeriodControls();
}
function statusLabel(s){return s==='pending'?t('pending'):s==='lost'?t('lost'):'PO';}
function methodLabel(s){return ({email:'E-mail',call:state.language==='es'?'Llamada':'Call',visit:state.language==='es'?'Visita':'Visit'})[s]||'—';}
function eventLabel(s){return ({created:state.language==='es'?'Creada':'Created',review_saved:state.language==='es'?'Revisión guardada':'Review saved',comment_added:state.language==='es'?'Comentario agregado':'Comment added',status_changed:state.language==='es'?'Estado cambiado':'Status changed',safe_changed:state.language==='es'?'Segura actualizada':'Safe updated',po_total_updated:'PO total',po_date_updated:t('po_date'),po_invoices_registered:state.language==='es'?'Facturas de PO registradas':'PO invoices registered',po_invoices_updated:state.language==='es'?'Facturas de PO actualizadas':'PO invoices updated',po_invoices_cleared:state.language==='es'?'Facturas de PO retiradas':'PO invoices cleared',po_invoices_migrated:state.language==='es'?'PO histórica migrada':'Historical PO migrated'})[s]||s;}
function renderLegend(){if(!state.system)return;$('#priority-legend').innerHTML=state.system==='special'?`<p>${t('priority')}</p><div><b class="priority s">S</b><small>Top 10%</small></div><div><b class="priority a">A</b><small>11–30%</small></div><div><b class="priority b">B</b><small>31–60%</small></div><div><b class="priority c">C</b><small>61–100%</small></div>`:`<p>${t('priority')}</p><div><b class="priority s">S</b><small>USD 5,001+</small></div><div><b class="priority a">A</b><small>USD 1,001–5,000</small></div><div><b class="priority b">B</b><small>USD 501–1,000</small></div><div><b class="priority c">C</b><small>USD 0–500</small></div>`;}

function showLogin(bootstrap){state.bootstrap=bootstrap;$('#app').classList.add('hidden');$('#login-subtitle').textContent=bootstrap?t('initial_setup'):t('signin');$('#login-submit').textContent=bootstrap?(state.language==='es'?'Crear Superadmin':'Create Superadmin'):t('signin');$('#bootstrap-note').classList.toggle('hidden',!bootstrap);$('#bootstrap-note').textContent=bootstrap?t('initial_setup'):'';$('#login-dialog').showModal();}
async function enterApp(user){
  state.me=user;
  state.language=$('#login-language').value||user.language||'en';
  state.calendar=await api('/api/calendar');
  applyLanguage();
  $('#user-name').textContent=user.display_name;
  $('#app').classList.remove('hidden');
  $('#login-dialog').close();
  $$('.admin-only').forEach(e=>e.classList.toggle('hidden',!user.can_admin_users));
  $$('.audit-only').forEach(e=>e.classList.toggle('hidden',!user.can_view_audit));
  $('#upload-button').classList.toggle('hidden',!user.can_edit);
  $$('.invoice-import-only').forEach(e=>e.classList.toggle('hidden',!user.can_edit));
  $('#report-scope').options[1].disabled=!user.can_team_reports;
  $('#system-dialog').showModal();
  if(user.must_change_password){
      $('#password-notice').textContent=state.language==='es'?'Debes reemplazar la contraseña temporal antes de continuar.':'Replace the temporary password before continuing.';
      $('#password-dialog').showModal();
  }
}

$('#login-language').addEventListener('change',()=>{state.language=$('#login-language').value;applyLanguage();if($('#login-dialog').open)showLogin(state.bootstrap);});
$('#login-form').addEventListener('submit',async e=>{e.preventDefault();$('#login-error').textContent='';try{const endpoint=state.bootstrap?'/api/auth/bootstrap':'/api/auth/login';const result=await api(endpoint,{method:'POST',body:JSON.stringify({username:$('#login-username').value,password:$('#login-password').value,language:$('#login-language').value})});await enterApp(result.user);}catch(err){$('#login-error').textContent=err.message;}});
$('#logout-button').addEventListener('click',async()=>{try{await api('/api/auth/logout',{method:'POST'});}catch(_){}state.me=null;state.system=null;showLogin(false);});
$('#language-select').addEventListener('change',async()=>{state.language=$('#language-select').value;applyLanguage();try{state.me=await api('/api/me/preferences',{method:'PATCH',body:JSON.stringify({language:state.language})});await navigate(state.view);}catch(e){toast(e.message,true);}});

async function selectSystem(system){
  state.system=system;
  $('#system-dialog').close();
  $('#system-button').textContent=system==='special'?'Special Quotations (JPY)':'Follow Up Quotations (USD)';
  $$('.special-only').forEach(e=>e.classList.toggle('hidden',system!=='special'));
  $$('.standard-only').forEach(e=>e.classList.toggle('hidden',system==='special'));
  if(!state.me?.can_edit)$$('.invoice-import-only').forEach(e=>e.classList.add('hidden'));

  renderLegend();
  await Promise.all([loadAgents(),loadRanks()]);
  await navigate('management');
}
$$('[data-system]').forEach(b=>b.addEventListener('click',()=>selectSystem(b.dataset.system).catch(e=>toast(e.message,true))));
$('#system-button').addEventListener('click',()=>$('#system-dialog').showModal());
function updateSidebarButton(){const collapsed=$('#app').classList.contains('sidebar-collapsed');
  $('#sidebar-toggle').setAttribute('aria-expanded',String(!collapsed));
  $('#sidebar-toggle').setAttribute('aria-label',t(collapsed?'show_navigation':'hide_navigation'));
}
function setSidebarCollapsed(collapsed){
  $('#app').classList.toggle('sidebar-collapsed',collapsed);
  sessionStorage.setItem('ntQuoteSidebarCollapsed',collapsed?'1':'0');updateSidebarButton();
}
$('#sidebar-toggle').addEventListener('click',()=>setSidebarCollapsed(!$('#app').classList.contains('sidebar-collapsed')));
setSidebarCollapsed(sessionStorage.getItem('ntQuoteSidebarCollapsed')==='1');
const savedPeriod=sessionStorage.getItem('ntQuoteDashboardPeriod')||'all';
$('#dashboard-period').value=['all','today','month','fiscal','custom'].includes(savedPeriod)?savedPeriod:'all';
$('#dashboard-start').value=sessionStorage.getItem('ntQuoteDashboardStart')||'';
$('#dashboard-end').value=sessionStorage.getItem('ntQuoteDashboardEnd')||'';
async function periodChanged(){
  sessionStorage.setItem('ntQuoteDashboardPeriod',$('#dashboard-period').value);
  sessionStorage.setItem('ntQuoteDashboardStart',$('#dashboard-start').value);
  sessionStorage.setItem('ntQuoteDashboardEnd',$('#dashboard-end').value);
  refreshPeriodControls();
  if(state.system)await navigate(state.view);
}
$('#dashboard-period').addEventListener('change',()=>periodChanged().catch(e=>toast(e.message,true)));
$('#dashboard-start').addEventListener('change',()=>periodChanged().catch(e=>toast(e.message,true)));
$('#dashboard-end').addEventListener('change',()=>periodChanged().catch(e=>toast(e.message,true)));

async function loadAgents(){const agents=await api(`${prefix()}/agents`);
const current=$('#global-agent').value;
$('#global-agent').innerHTML=`<option value="">${t('all_agents')}</option>`+agents.map(a=>`<option ${a===current?'selected':''}>${esc(a)}</option>`).join('');
if(!current&&state.me?.role==='user'){const match=agents.find(a=>a.toLowerCase().startsWith((state.me.agent_name||'').split(' ')[0].toLowerCase()));
  if(match)$('#global-agent').value=match;
}
}
async function loadRanks(){if(state.system!=='special')return;const ranks=await api('/api/special/ranks');
  $('#rank-filter').innerHTML='<option value="">All</option>'+ranks.map(r=>`<option>${esc(r)}</option>`).join('');}

async function navigate(view){
  if(!['management','monthly_report','reports','users','directorio'].includes(view))view='management';
  state.view=view;
  $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  $$('.view').forEach(v=>v.classList.remove('active'));
  const titles={dashboard:t('dashboard'),management:t('management'),pending:t('priorities'),managed:t('managed'),safe:t('safe'),po_missing:t('po_missing'),po:'PO',lost:t('lost'),archive:t('archive'),historical:t('historical'),monthly_report:t('monthly_report'),reports:t('reports'),users:t('users'),directorio:state.language==='es'?'Directorio Digital':'Digital Directory'};
  $('#page-title').textContent=titles[view]||view;
  const nonStandard=view==='monthly_report'||view==='directorio';
  $('#dashboard-period-controls').classList.toggle('hidden',nonStandard);
  $('#pending-total-banner').classList.toggle('hidden',nonStandard);
  $('#global-agent-wrap').classList.toggle('hidden',nonStandard);
  if(!nonStandard)await updateGlobalTotal();
  if(view==='dashboard'){$('#view-dashboard').classList.add('active');await renderDashboard();}
  else if(view==='monthly_report'){$('#view-monthly-report').classList.add('active');await renderMonthlyReport();}
  else if(view==='reports'){$('#view-reports').classList.add('active');setPreset('daily');await renderReport();}
  else if(view==='users'){$('#view-users').classList.add('active');await renderUsers();}
  else if(view==='directorio'){$('#view-directorio').classList.add('active');await renderDirectorio();}
  else{$('#view-list').classList.add('active');await renderList();}
}
$$('.nav-item').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.view).catch(e=>toast(e.message,true))));
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.go)));
$('#global-agent').addEventListener('change',()=>navigate(state.view).catch(e=>toast(e.message,true)));

async function updateGlobalTotal(){if(!state.system)return;
  const data=await api(`${prefix()}/dashboard?${dashboardQuery()}`);
  $('#global-pending-total').textContent=money(data.counts.pending_value);
  $('#global-po-total').textContent=money(data.counts.po_value);
}
async function renderDashboard(){const [data,rows]=await Promise.all([api(`${prefix()}/dashboard?${dashboardQuery()}`),api(`${prefix()}/quotes?${dashboardQuery({status:'pending',safe:'0',order:'priority'})}`)]);const c=data.counts;
  $('#kpis').innerHTML=[ [data.added_today,t('added_today'),'blue'],[c.pending||0,t('pending'),'orange'],[data.overdue_count,t('overdue'),'red'],[data.po_today,t('po_today'),'green'] ].map(([v,l,cl])=>`<div class="kpi ${cl}"><span>${l}</span><strong>${v}</strong><small>${t('quotations')}</small></div>`).join('');
  const by=Object.fromEntries(data.priorities.map(x=>[x.priority,x]));$('#priority-summary').innerHTML='SABC'.split('').map(p=>{const x=by[p]||{count:0,value:0};return `<div class="priority-card"><span class="priority ${p.toLowerCase()}">${p}</span><strong>${money(x.value)}</strong><small>${x.count} ${t('quotations')}</small></div>`}).join('');
  $('#pipeline-summary').innerHTML=`<div><span>${t('pending_total')}</span><strong>${money(c.pending_value)}</strong></div><div><span>${t('po_total')}</span><strong>${money(c.po_value)}</strong></div><div class="grand"><span>${t('grand_total')}</span><strong>${money(Number(c.pending_value||0)+Number(c.po_value||0))}</strong></div>`;
  $('#followup-alert').innerHTML=data.overdue_count?`<div class="followup-alert"><b>!</b><div><h2>${data.overdue_count} ${t('overdue')}</h2><p>${data.overdue_quotes.map(q=>`${esc(q.folio||q.source_quote_number||'')} (${q.days_since_activity}${t('days')})`).join(' · ')}</p></div><button class="button ghost" id="open-overdue">${t('view_all')}</button></div>`:`<div class="followup-alert clear"><b>✓</b><div><h2>${state.language==='es'?'No hay seguimientos vencidos':'No overdue follow-ups'}</h2></div></div>`;
  $('#open-overdue')?.addEventListener('click',()=>navigate('managed'));
  const b=data.backup||{};$('#backup-status').innerHTML=`<div class="backup-card ${b.overdue?'warning':'ok'}"><strong>${b.overdue?t('backup_due'):t('backup_ok')}</strong><span>${b.finished_at?fmtDT(b.finished_at):'—'}</span>${state.me.can_admin_users?'<button id="run-backup" class="button ghost">Backup now</button>':''}</div>`;$('#run-backup')?.addEventListener('click',runBackup);
  $('#dashboard-table').innerHTML=quoteTable(rows.slice(0,6),true);
}
async function runBackup(){try{const r=await api('/api/backup/run',{method:'POST'});toast(r.ok?t('backup_ok'):r.error);await renderDashboard();}catch(e){toast(e.message,true);}}

function configureListControls(){
  const managed=state.view==='managed';
  const management=state.view==='management';
  $('#status-filter-wrap').classList.toggle('hidden',!(managed||management));
  $('#distributor-filter-wrap').classList.toggle('hidden',!management||state.system==='special');
  $('#end-user-filter-wrap').classList.toggle('hidden',!management);
  $('#clear-list-filters').classList.toggle('hidden',!(managed||management));
  const statusSelect = $('#status-filter');
  let unmanagedOption=statusSelect?.querySelector('option[value="unmanaged"]');
  if(management){
    if(!unmanagedOption){
      unmanagedOption=document.createElement('option');
      unmanagedOption.value='unmanaged';
      statusSelect.appendChild(unmanagedOption);
    }
    unmanagedOption.textContent=state.language==='es'?'No gestionadas':state.language==='ja'?'未対応':'Unmanaged';
  }else if(unmanagedOption){
    if(statusSelect.value==='unmanaged')statusSelect.value='';
    unmanagedOption.remove();
  }
  $('#priority-filter-wrap').classList.toggle('hidden',managed);
  $('#rank-filter-wrap').classList.toggle('hidden',managed||state.system!=='special');
  $('#order-filter-wrap').classList.toggle('hidden',managed);
  $('#management-summary').classList.toggle('hidden',!management);
  if(managed)$('#quote-order').value='newest_activity';
}
function listParams(){
  const managed=state.view==='managed';const management=state.view==='management';
  const p=new URLSearchParams({agent:$('#global-agent').value,search:$('#quote-search').value});
  if(management&&state.system!=='special'&&$('#distributor-filter').value)p.set('distributor',$('#distributor-filter').value);
  if(management&&$('#end-user-filter').value)p.set('end_user',$('#end-user-filter').value);
  if(!managed)p.set('priority',$('#priority-filter').value);
  if(state.system==='special'&&!managed)p.set('rank',$('#rank-filter').value);
  p.set('order',managed?'status_activity':$('#quote-order').value);
  if(managed||management){if($('#status-filter').value)p.set('status',$('#status-filter').value);}
  const {start,end}=dashboardRange();
  if(start&&end){p.set('start',start);p.set('end',end);}
  const v=state.view;
  if(v==='pending'){p.set('status','pending');p.set('safe','0');}
  if(v==='safe'){p.set('status','pending');p.set('safe','1');}
  if(v==='po')p.set('status','po');
  if(v==='lost')p.set('status','lost');
  if(v==='po_missing')p.set('po_missing','1');
  if(v==='archive')p.set('archive','1');
  if(v==='historical')p.set('historical','1');
  return p;
}
function managementSummary(data){
  const by=Object.fromEntries(data.priorities.map(x=>[x.priority,x]));
  const cards='SABC'.split('').map(p=>{const x=by[p]||{count:0,value:0};return `<div class="priority-card"><span class="priority ${p.toLowerCase()}">${p}</span><strong>${money(x.value)}</strong><small>${x.count} ${t('quotations')}</small></div>`}).join('');
  const c=data.counts;
  
  // --- NUEVO: Tarjetas de Efectividad de Contacto ---
  const resp = data.responses || { yes: 0, no: 0, pending: 0 };
  const responseCards = `
    <div style="display: flex; gap: 10px; margin-top: 15px; margin-bottom: 20px;">
        <div style="flex:1; background:#e6f4ea; padding:10px; border-radius:8px; text-align:center; border:1px solid #ceead6;">
            <span style="font-size:20px; font-weight:bold; color:#137333; display:block;">${resp.yes}</span>
            <small style="color:#137333;">${state.language==='es'?'✅ Con Respuesta':'✅ Responded'}</small>
        </div>
        <div style="flex:1; background:#fce8e6; padding:10px; border-radius:8px; text-align:center; border:1px solid #f9d2ce;">
            <span style="font-size:20px; font-weight:bold; color:#c5221f; display:block;">${resp.no}</span>
            <small style="color:#c5221f;">${state.language==='es'?'❌ Sin Respuesta':'❌ No Response'}</small>
        </div>
        <div style="flex:1; background:#fef7e0; padding:10px; border-radius:8px; text-align:center; border:1px solid #fde293;">
            <span style="font-size:20px; font-weight:bold; color:#b06000; display:block;">${resp.pending}</span>
            <small style="color:#b06000;">${state.language==='es'?'⏳ En Espera':'⏳ Pending'}</small>
        </div>
    </div>
  `;

  return `<h3>${t('priority_distribution')}</h3>
          <div class="priority-summary">${cards}</div>
          <h3>${state.language==='es'?'Efectividad de Contacto':'Contact Effectiveness'}</h3>
          ${responseCards}
          <div class="pipeline-summary">
              <div><span>${t('pending_total')}</span><strong>${money(c.pending_value)}</strong></div>
              <div><span>${t('po_total')}</span><strong>${money(c.po_value)}</strong></div>
              <div class="grand"><span>${t('grand_total')}</span><strong>${money(Number(c.pending_value||0)+Number(c.po_value||0))}</strong></div>
          </div>
          ${trackingLegend()}`;
}
async function renderList(){
  configureListControls();
  const managed=state.view==='managed';const management=state.view==='management';
  const endpoint=management?`${prefix()}/management`:managed?`${prefix()}/managed`:`${prefix()}/quotes`;
  const requests=[api(`${endpoint}?${listParams()}`)];
  if(management)requests.push(api(`${prefix()}/dashboard?${dashboardQuery()}`));
  const [rows,summary]=await Promise.all(requests);
  if(management)$('#management-summary').innerHTML=managementSummary(summary);
  $('#quote-count').textContent=rows.length;
  const total=rows.reduce((sum,q)=>sum+Number(state.view==='po'?q.po_total_usd:(state.system==='special'?q.unit_price:q.total_usd)||0),0);
  $('#quote-total').textContent=`${t(state.view==='po'?'po_total':'quoted_total')}: ${money(total)}`;
  $('#quotes-table').innerHTML=management?managementTable(rows):quoteTable(rows,false,managed);
  wireRows();
}

function rowActions(q,compact=false){return compact?'':`<div class="row-actions"><button class="manage view-btn" data-id="${q.id}">${t('view')}</button>${(!q.is_historical&&!q.is_archived&&state.me.can_edit)?`<button class="manage manage-btn" data-id="${q.id}">${t('manage')}</button>`:''}${(q.is_archived&&state.me.can_admin_users)?`<button class="manage restore-btn" data-id="${q.id}">${t('restore')}</button>`:''}</div>`;}
function trackingClass(q){if(q.status==='po')return 'tracking-green';if(q.status==='lost')return 'tracking-purple';const days=Number(q.days_since_activity||0);return days>=15?'tracking-red':days>=9?'tracking-orange':'tracking-white';}
function ageBadge(q) {
  const days = Number(q.quote_age_days || 0);
  const risk = q.status === 'pending' && days > 60;
  const label = days > 90 ? `90+ ${t('days')}` : `${days} ${t('days')}`;
  const riskText = risk ? (state.language === 'es' ? ' · Riesgo alto' : ' · High loss risk') : '';
  return `<span class="age-badge${days > 90 ? ' stale' : risk ? ' risk' : ''}">${label}${riskText}</span>`;
}
function activityCell(q) {
  let detail = '';
  if (q.activity_is_initial) {
    detail = `<span class="initial-badge">${t('initial_import')}</span>`;
  } else if (q.follow_up_type) {
    detail = `<span class="initial-badge">FollowUp - ${methodLabel(q.follow_up_type)}</span>`;
  }
  
  return `${fmtDT(q.last_activity_at)}${detail}`;
}
function trackingLegend() {
  const labels = state.language === 'es' 
    ? ['Pending 0–8 días', 'Pending 9–14 días', 'Pending 15+ días', 'PO', 'Lost'] 
    : ['Pending 0–8 days', 'Pending 9–14 days', 'Pending 15+ days', 'PO', 'Lost'];
  // Aquí agregamos los códigos de color hexadecimales exactos de tu CSS
  const bgColors = ['#fff', '#fff0da', '#ffe1e5', '#ddf6eb', '#eee7ff'];

  return `<div class="row-legend"><b>${t('color_legend')}:</b>${labels.map((label, i) => `<span><i style="background-color: ${bgColors[i]}; border: 1px solid #ccc;"></i>${label}</span>`).join('')}</div>`;
}
function managementTable(rows) {
  if (!rows.length) return `<div class="empty">${t('no_records')}</div>${trackingLegend()}`;
  
  const head = `<tr>
    <th>${t('priority')}</th>
    <th>${t('date')}</th>
    <th>${t('reference')}</th>
    <th>${t('distributor_code')}</th>
    <th>${t('end_user')}</th>
    <th>${t('order')}</th>
    <th>${t('status')}</th>
    <th>${t('po_date')}</th>
    <th>${t('po_total')}</th>
    <th>${t('quote_age')}</th>
    <th>${t('last_activity')}</th>
    <th></th>
  </tr>`;

  const body = rows.map(q => {
    const isPo = q.status === 'po';
    const poDate = isPo && q.po_date ? fmtDate(q.po_date) : '—';
    const poTotal = isPo && q.po_total_usd ? money(q.po_total_usd) : '—';
    
    return `<tr class="${trackingClass(q)}">
      <td><span class="priority ${q.priority.toLowerCase()}">${q.priority}</span></td>
      <td>${fmtDate(q.quote_date)}</td>
      <td class="folio">${esc(q.folio)}</td>
      <td>${state.system === 'special' ? '—' : esc(q.distributor_code) || t('no_code')}</td>
      <td>${esc(state.system === 'special' ? q.receptor : q.end_user) || '—'}</td>
      <td>${esc(q.customer_order) || '—'}</td>
      <td>${statusBadges(q)}</td>
      <td>${poDate}</td>
      <td class="money">${poTotal}</td>
      <td>${ageBadge(q)}</td>
      <td>${activityCell(q)}</td>
      <td>${rowActions(q)}</td>
    </tr>`;
  }).join('');

  return `<table><thead>${head}</thead><tbody>${body}</tbody></table>${trackingLegend()}`;
}
function quoteTable(rows, compact = false, managed = false) {
  if (!rows.length) return `<div class="empty">${t('no_records')}</div>`;
  const showLoss = !compact && state.view === 'lost';
  const showPo = !compact && state.view === 'po';
  const rowClass = q => managed ? ` class="${trackingClass(q)}"` : '';

  // Encabezados y filas para JPY (Special)
  let headJPY = `<tr><th>${t('priority')}</th><th>${t('date')}</th><th>${t('reference')}</th><th>${t('end_user')}</th><th>${t('rank')}</th><th>Code</th><th>${t('model')}</th><th>${t('quantity')}</th><th>${t('unit_price')} (JPY)</th>${showPo ? `<th>${t('po_date')}</th><th>${t('po_total')} (JPY)</th>` : ''}<th>${t('status')}</th>${showLoss ? `<th>${t('reason')}</th>` : ''}${managed ? `<th>${t('last_activity')}</th>` : ''}${compact ? '' : '<th></th>'}</tr>`;
  
  let bodyJPY = rows.map(q => `<tr${rowClass(q)}><td><span class="priority ${q.priority.toLowerCase()}">${q.priority}</span></td><td>${fmtDate(q.quote_date)}</td><td class="folio">${esc(q.folio)}</td><td>${esc(q.receptor)}</td><td>${esc(q.rank) || '—'}</td><td>${esc(q.code)}</td><td>${esc(q.description)}</td><td>${Number(q.quantity).toLocaleString()}</td><td class="money">${money(q.unit_price)}</td>${showPo ? `<td>${fmtDate(q.po_date)}</td><td class="money">${q.po_total_usd ? money(q.po_total_usd) : '—'}</td>` : ''}<td>${statusBadges(q)}</td>${showLoss ? `<td>${esc(q.loss_reason) || '—'}</td>` : ''}${managed ? `<td>${activityCell(q)}</td>` : ''}${compact ? '' : `<td>${rowActions(q)}</td>`}</tr>`).join('');

  if (state.system === 'special') {
    return `<table><thead>${headJPY}</thead><tbody>${bodyJPY}</tbody></table>${managed ? trackingLegend() : ''}`;
  }

  // Encabezados y filas para USD (Standard)
  let headUSD = `<tr><th>${t('priority')}</th><th>${t('date')}</th><th>${t('reference')}</th><th>${t('distributor_code')}</th><th>${t('end_user')}</th><th>${t('dist_agent')}</th><th>${t('nt_agent')}</th><th>${t('quoted_total')} (USD)</th><th>${t('order')}</th>${showPo ? `<th>${t('po_date')}</th><th>${t('po_total')} (USD)</th>` : ''}<th>${t('status')}</th>${showLoss ? `<th>${t('reason')}</th>` : ''}${managed ? `<th>${t('last_activity')}</th>` : ''}${compact ? '' : '<th></th>'}</tr>`;
  
  let bodyUSD = rows.map(q => `<tr${rowClass(q)}><td><span class="priority ${q.priority.toLowerCase()}">${q.priority}</span></td><td>${fmtDate(q.quote_date)}</td><td class="folio">${esc(q.folio)}</td><td>${esc(q.distributor_code) || t('no_code')}</td><td>${esc(q.end_user) || '—'}</td><td>${esc(q.distributor_agent) || '—'}</td><td>${esc(q.nt_agent) || '—'}</td><td class="money">${money(q.total_usd)}</td><td>${esc(q.customer_order) || '—'}</td>${showPo ? `<td>${fmtDate(q.po_date)}</td><td class="money">${q.po_total_usd ? money(q.po_total_usd) : '—'}</td>` : ''}<td>${statusBadges(q)}</td>${showLoss ? `<td>${esc(q.loss_reason) || '—'}</td>` : ''}${managed ? `<td>${activityCell(q)}</td>` : ''}${compact ? '' : `<td>${rowActions(q)}</td>`}</tr>`).join('');

  return `<table><thead>${headUSD}</thead><tbody>${bodyUSD}</tbody></table>${managed ? trackingLegend() : ''}`;
}
function statusBadges(q) {
  return `<span class="status ${q.status}">${statusLabel(q.status)}</span>` +
         `${q.has_invoices ? `<span class="safe-badge" style="background-color: #17a2b8; color: white;">📊 Excel</span>` : ''}` +
         `${q.is_safe ? `<span class="safe-badge">${t('safe')}</span>` : ''}` +
         `${q.po_detected && !q.po_date ? `<span class="warning-badge">${t('po_missing')}</span>` : ''}` +
         `${q.is_historical ? `<span class="history-badge">${t('read_only')}</span>` : ''}` +
         `${q.is_archived ? `<span class="history-badge">${t('archive')}</span>` : ''}`;
}
function wireRows(){$$('.view-btn').forEach(b=>b.addEventListener('click',()=>openView(Number(b.dataset.id))));$$('.manage-btn').forEach(b=>b.addEventListener('click',()=>openManage(Number(b.dataset.id))));$$('.restore-btn').forEach(b=>b.addEventListener('click',()=>restoreQuote(Number(b.dataset.id))));}
async function restoreQuote(id){try{await api(`/api/special/archive/${id}/restore`,{method:'POST'});toast(t('restore'));await renderList();}catch(e){toast(e.message,true);}}

function normalizeQuote(raw){const q={...(raw||{})};for(const key of ['folio','quote_date','receptor','rank','code','description','nt_agent','status','po_date','series','distributor_company','end_user','distributor_agent','customer_order','loss_reason','follow_up_type'])if(q[key]==null)q[key]='';q.comments=Array.isArray(q.comments)?q.comments:[];q.events=Array.isArray(q.events)?q.events:[];q.invoices=Array.isArray(q.invoices)?q.invoices:[];return q;}
function detailsHtml(raw){const q=normalizeQuote(raw);const pairs=state.system==='special'?[[t('reference'),q.folio||'—'],[t('date'),fmtDate(q.quote_date)],[t('end_user'),q.receptor||'—'],[t('rank'),q.rank||'—'],["Item code",q.code||'—'],[t('model'),q.description||'—'],[t('quantity'),q.quantity??'—'],[`${t('unit_price')} (JPY)`,money(q.unit_price)],[t('nt_agent'),q.nt_agent||'—'],[t('status'),statusLabel(q.status)]]:[[t('reference'),q.folio||'—'],[t('date'),fmtDate(q.quote_date)],["Series",q.series||'—'],[t('company'),q.distributor_company||'—'],[t('distributor_code'),q.distributor_code||t('no_code')],[t('end_user'),q.end_user||'—'],[t('dist_agent'),q.distributor_agent||'—'],[t('nt_agent'),q.nt_agent||'—'],[`${t('quoted_total')} (USD)`,money(q.total_usd)],[t('net_total'),q.net_total_usd==null?'—':money(q.net_total_usd)],[t('order'),q.customer_order||'—'],[t('status'),statusLabel(q.status)]];pairs.push([t('result'),responseLabel(q.effective_response||q.client_response||'pending')]);if(q.status==='po')pairs.push([t('po_date'),fmtDate(q.po_date)],[t('po_total'),q.po_total_usd?money(q.po_total_usd):'—']);if(q.status==='lost')pairs.push([t('reason'),q.loss_reason||'—']);return pairs.map(([k,v])=>`<div><span>${esc(k)}</span><strong>${esc(v==null?'—':v)}</strong></div>`).join('');}
function commentsHtml(comments){return comments?.length?comments.map(c=>`<div class="history-item"><strong>${esc(c.user_name)}</strong><time>${fmtDT(c.created_at)}</time><p>${esc(c.body)}</p></div>`).join(''):`<p class="muted">${t('no_comments')}</p>`;}
function invoicesHtml(invoices){return `<table class="invoice-table"><thead><tr><th>${t('invoice_date')}</th><th>${t('invoice_series')}</th><th>${t('invoice_number')}</th><th>${t('invoice_amount')}</th></tr></thead><tbody>${invoices.map(row=>`<tr><td>${fmtDate(row.invoice_date)}</td><td>${esc(row.invoice_series)}</td><td class="folio">${esc(row.invoice_number)}</td><td class="money">${money(row.amount)}</td></tr>`).join('')}</tbody></table>`;}
async function openView(id){
  try{
    const q=normalizeQuote(await api(`${prefix()}/quotes/${id}`));
    state.quote=q;
    $('#view-title').textContent=q.folio;
    $('#view-details').innerHTML=detailsHtml(q);
    
    // --- NUEVO: Inyectar botón de Gestionar dentro del panel de Vista ---
    let btn = document.getElementById('btn-view-to-manage');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'btn-view-to-manage';
        btn.className = 'button primary';
        btn.style.width = '100%';
        btn.style.marginTop = '15px';
        btn.style.marginBottom = '15px';
        btn.style.padding = '10px';
        btn.style.fontWeight = 'bold';
        // Lo insertamos justo debajo del resumen de detalles
        $('#view-details').parentNode.insertBefore(btn, $('#view-details').nextSibling);
    }
    btn.textContent = state.language === 'es' ? '⚙️ Gestionar esta cotización' : '⚙️ Manage this quotation';
    btn.style.display = (!q.is_historical && !q.is_archived && state.me.can_edit) ? 'block' : 'none';
    btn.onclick = () => { 
        $('#view-dialog').close(); 
        openManage(id); 
    };
    // -------------------------------------------------------------------

    const showInvoices=q.status==='po'&&q.invoices.length;
    $('#view-invoices-section').classList.toggle('hidden',!showInvoices);
    $('#view-invoices').innerHTML=showInvoices?invoicesHtml(q.invoices):'';
    $('#view-comments').innerHTML=commentsHtml(q.comments);
    $('#view-events').innerHTML=q.events?.length?q.events.slice().reverse().map(e=>`<div class="history-item"><strong>${esc(eventLabel(e.event_type))}</strong><time>${esc(e.user_name||'System')} · ${fmtDT(e.created_at)}</time><p>${esc(e.change_summary?monthlyChangeLabel(e.change_summary):(e.note||''))}</p></div>`).join(''):`<p class="muted">${t('no_activity')}</p>`;
    $('#view-dialog').showModal();
  }catch(e){toast(e.message,true);}
}
function invoiceRow(row={}){return `<div class="invoice-row"><label><span>${t('invoice_date')}</span><input class="invoice-date" type="date" value="${esc(row.invoice_date||'')}" required></label><label><span>${t('invoice_series')}</span><input class="invoice-series" value="${esc(row.invoice_series||'')}" placeholder="IV" maxlength="40" required></label><label><span>${t('invoice_number')}</span><input class="invoice-number" value="${esc(row.invoice_number||'')}" placeholder="8,772" maxlength="100" required></label><label><span>${t('invoice_amount')} (${currency()})</span><input class="invoice-amount" type="number" min="0.01" step="0.01" value="${row.amount??''}" required></label><button class="remove-invoice" type="button" title="${t('remove')}">×</button></div>`;}
function renderInvoiceRows(rows=[]){$('#invoice-rows').innerHTML=rows.map(invoiceRow).join('');updateInvoiceTotal();} function invoicePayload(){return $$('.invoice-row').map(row=>({invoice_date:row.querySelector('.invoice-date').value,invoice_series:row.querySelector('.invoice-series').value.trim(),invoice_number:row.querySelector('.invoice-number').value.trim(),amount:Number(row.querySelector('.invoice-amount').value||0)}));} function updateInvoiceTotal(){const total=$$('.invoice-amount').reduce((sum,input)=>sum+Number(input.value||0),0);$('#invoice-total-value').textContent=money(total);}
$('#invoice-rows').addEventListener('input',updateInvoiceTotal);$('#invoice-rows').addEventListener('click',event=>{const button=event.target.closest('.remove-invoice');if(button){button.closest('.invoice-row')?.remove();updateInvoiceTotal();}});
$('#add-invoice').addEventListener('click',()=>{$('#invoice-rows').insertAdjacentHTML('beforeend',invoiceRow());updateInvoiceTotal();});
async function openManage(id) {
  try {
    const q = normalizeQuote(await api(`${prefix()}/quotes/${id}`));
    state.quote = q;
    if (q.read_only) return toast(t('read_only'), true);

    const statusToSet = ['pending', 'po', 'lost'].includes(q.status) ? q.status : 'pending';

    $('#manage-title').textContent = q.folio || '—';
    $('#manage-summary').innerHTML = detailsHtml(q);
    const staleWarning = $('#stale-warning');
    const showRisk = statusToSet === 'pending' && Number(q.quote_age_days || 0) > 60;
    staleWarning.textContent = showRisk ? t('stale_question') : '';
    staleWarning.classList.toggle('hidden', !showRisk);
    
    $('#manage-status').value = statusToSet;
    $('#manage-method').value = q.follow_up_type;

    // --- NUEVO: Inyectar Selector de Respuesta ---
    let responseSelect = $('#manage-client-response');
    if (!responseSelect) {
        const wrapper = document.createElement('div');
        wrapper.id = 'manage-response-wrapper';
        wrapper.style.marginTop = '10px';
        wrapper.innerHTML = `
            <label style="display: block;">
                <span style="font-weight: bold; display: block; margin-bottom: 5px; font-size: 13px; color: #333;">
                    ${state.language === 'es' ? '¿Hubo respuesta del cliente/proveedor?' : 'Did the client respond?'}
                </span>
                <select id="manage-client-response" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 5px;">
                    <option value="pending">${state.language === 'es' ? '⏳ Esperando respuesta' : '⏳ Awaiting response'}</option>
                    <option value="yes">${state.language === 'es' ? '✅ Sí, respondió' : '✅ Yes, responded'}</option>
                    <option value="no">${state.language === 'es' ? '❌ No hubo respuesta' : '❌ No response'}</option>
                </select>
            </label>
        `;
        const methodInput = $('#manage-method');
        const targetContainer = methodInput.closest('label') || methodInput;
        targetContainer.parentNode.insertBefore(wrapper, targetContainer.nextSibling);
        responseSelect = $('#manage-client-response');
    }
    // Si la cotización ya tenía una respuesta guardada, la cargamos
    responseSelect.value = q.effective_response || q.client_response || 'pending';
    // --------------------------------------------

    $('#manage-loss').value = q.loss_reason;
    $('#manage-safe').checked = !!q.is_safe;
    $('#manage-comment').value = '';
    $('#manage-comments').innerHTML = commentsHtml(q.comments);
    renderInvoiceRows(q.invoices);
    toggleManage();
    
    if (!$('#manage-dialog').open) $('#manage-dialog').showModal();
  } catch (e) {
    toast(e?.message || 'Unable to open this quotation', true);
  }
}
function toggleManage(){const s=$('#manage-status').value;$('#manage-dialog').classList.toggle('po-mode',s==='po');$('#loss-wrap').classList.toggle('hidden',s!=='lost');$('#po-fields').classList.toggle('hidden',s!=='po');$('#safe-wrap').classList.toggle('hidden',s!=='pending');$('#manage-comment-wrap').classList.toggle('hidden',s==='po');$('#manage-loss').required=s==='lost';if(s==='po'&&!$$('.invoice-row').length)renderInvoiceRows([{}]);$$('.invoice-row input').forEach(input=>input.required=s==='po');}$('#manage-status').addEventListener('change',toggleManage);
$('#manage-form').addEventListener('submit',async e=>{
  e.preventDefault();
  try{
    const status=$('#manage-status').value;
    const responseSelect = $('#manage-client-response');
    
    await api(`${prefix()}/quotes/${state.quote.id}`,{
      method:'PATCH',
      body:JSON.stringify({
        status,
        follow_up_type:$('#manage-method').value,
        client_response: responseSelect ? responseSelect.value : 'pending',
        is_safe:$('#manage-safe').checked,
        loss_reason:$('#manage-loss').value,
        comment:status==='po'?'':$('#manage-comment').value,
        invoices:status==='po'?invoicePayload():[]
      })
    });
    $('#manage-dialog').close();
    toast(state.language==='es'?'Seguimiento guardado':'Follow-up saved');
    await navigate(state.view);
  }catch(err){
    toast(err.message,true);
  }
});

let searchTimer;const delayedListRender=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>renderList().catch(e=>toast(e.message,true)),250);};
$('#quote-search').addEventListener('input',delayedListRender);
$('#distributor-filter').addEventListener('input',delayedListRender);
$('#end-user-filter').addEventListener('input',delayedListRender);
$('#priority-filter').addEventListener('change',()=>renderList());
$('#rank-filter').addEventListener('change',()=>renderList());
$('#quote-order').addEventListener('change',()=>renderList());
$('#status-filter').addEventListener('change',()=>renderList());
$('#clear-list-filters').addEventListener('click',()=>{
  $('#quote-search').value='';$('#status-filter').value='';$('#priority-filter').value='';$('#rank-filter').value='';
  $('#distributor-filter').value='';$('#end-user-filter').value='';$('#quote-order').value='priority';
  renderList().catch(e=>toast(e.message,true));
});

function setMonthlyCurrentPeriod(){
  $('#monthly-start').value=state.calendar?.month_start||isoLocal(new Date(businessToday().getFullYear(),businessToday().getMonth(),1));
  $('#monthly-end').value=state.calendar?.today||isoLocal(businessToday());
}
async function loadMonthlyUsers(){
  const select=$('#monthly-user');const previous=select.value;
  const users=await api('/api/report-users');
  const options=state.me?.can_team_reports?`<option value="all">${t('all_users')}</option>`:'';
  select.innerHTML=options+users.map(user=>`<option value="${Number(user.id)}">${esc(user.display_name)}</option>`).join('');
  const preferred=previous||String(state.me.id);
  select.value=[...select.options].some(option=>option.value===preferred)?preferred:String(state.me.id);
}
function responseLabel(value){return value==='yes'?t('responded'):value==='no'?t('no_response'):t('awaiting_response');}
function responseEvidence(row){if((row.effective_response||row.client_response)!=='yes'||!row.response_at)return '';const source=row.response_basis==='po'?'PO':row.response_basis==='lost'?statusLabel('lost'):'';return `<small class="response-evidence">${source?`${esc(source)} · `:''}${fmtDT(row.response_at)}${row.response_by?` · ${esc(row.response_by)}`:''}</small>`;}
function monthlyChangeLabel(value){
  return String(value||'').split(';').map(part=>{
    const [key,raw='']=part.trim().split('=');
    if(key==='method')return `${t('method')}: ${methodLabel(raw)}`;
    if(key==='status'){const [from,to]=raw.split('->');return `${t('status')}: ${statusLabel(from)} → ${statusLabel(to)}`;}
    if(key==='response'){const values=raw.split('->');return `${t('result')}: ${values.map(responseLabel).join(' → ')}`;}
    if(key==='comment')return state.language==='es'?'Comentario agregado':state.language==='ja'?'コメント追加':'Comment added';
    if(key==='safe')return raw==='1'?(state.language==='es'?'Marcada segura':'Marked Safe'):(state.language==='es'?'Segura retirada':'Safe removed');
    if(key==='invoices')return `${t('invoices')}: ${raw}`;
    return part.trim();
  }).filter(Boolean).join(' · ');
}
function monthlyTable(rows){
  if(!rows.length)return `<div class="empty">${t('no_records')}</div>`;
  const head=`<tr><th>${t('last_activity')}</th><th>${t('reference')}</th><th>${t('activity_by')}</th><th>${t('assigned_agent')}</th><th>${t('result')}</th><th>${t('method')}</th><th>${t('status')}</th><th>${t('change_made')}</th><th>${t('quoted_total')}</th><th></th></tr>`;
  const body=rows.map(row=>{const effective=row.effective_response||row.client_response||'pending';return `<tr><td>${fmtDT(row.last_activity_at)}</td><td class="folio">${esc(row.folio)}</td><td>${esc(row.managed_by)}</td><td>${esc(row.nt_agent)||'—'}</td><td><span class="response-badge ${effective}">${responseLabel(effective)}</span>${responseEvidence(row)}</td><td>${methodLabel(row.follow_up_type)}</td><td><span class="status ${row.status}">${statusLabel(row.status)}</span></td><td class="change-summary">${esc(monthlyChangeLabel(row.change_summary))}<span class="initial-badge activity-count">${Number(row.activity_count||0)} ${t('saved_activities')}</span></td><td class="money">${money(row.amount)}</td><td><button class="manage view-btn" data-id="${Number(row.quote_id)}">${t('view')}</button></td></tr>`;}).join('');
  return `<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
}
async function renderMonthlyReport(){
  if(!$('#monthly-start').value||!$('#monthly-end').value)setMonthlyCurrentPeriod();
  await loadMonthlyUsers();
  const start=$('#monthly-start').value;const end=$('#monthly-end').value;
  if(end<start)throw new Error(state.language==='es'?'La fecha final no puede ser anterior a la inicial.':'End date cannot be before start date.');
  const params=new URLSearchParams({start,end,user:$('#monthly-user').value,result:$('#monthly-result').value,status:$('#monthly-status').value});
  const data=await api(`${prefix()}/monthly-report?${params}`);const responses=data.responses||{yes:0,no:0,pending:0};
  const cards=[['yes',responses.yes,t('responded'),'responded'],['no',responses.no,t('no_response'),'no-response'],['pending',responses.pending,t('awaiting_response'),'awaiting'],['managed',data.managed_count,t('managed_quotes'),'managed']];
  $('#monthly-kpis').innerHTML=cards.map(([value,count,label,style])=>`<button type="button" class="monthly-kpi ${style}${$('#monthly-result').value===value?' active':''}" data-monthly-result="${value}"><strong>${Number(count||0)}</strong><span>${label}</span></button>`).join('');
  $$('[data-monthly-result]').forEach(button=>button.addEventListener('click',()=>{$('#monthly-result').value=button.dataset.monthlyResult;renderMonthlyReport().catch(e=>toast(e.message,true));}));
  $('#monthly-period-label').textContent=`${fmtDate(data.start_date)} – ${fmtDate(data.end_date)} · ${data.activity_count} ${t('saved_activities')}`;
  $('#monthly-count').textContent=data.rows.length;
  $('#monthly-table').innerHTML=monthlyTable(data.rows);
  wireRows();
}
$('#monthly-current').addEventListener('click',()=>{setMonthlyCurrentPeriod();renderMonthlyReport().catch(e=>toast(e.message,true));});
$('#monthly-refresh').addEventListener('click',()=>renderMonthlyReport().catch(e=>toast(e.message,true)));
$('#monthly-clear').addEventListener('click',()=>{setMonthlyCurrentPeriod();$('#monthly-user').value=state.me?.can_team_reports?'all':String(state.me?.id||'');$('#monthly-result').value='managed';$('#monthly-status').value='all';renderMonthlyReport().catch(e=>toast(e.message,true));});
$('#monthly-user').addEventListener('change',()=>renderMonthlyReport().catch(e=>toast(e.message,true)));
$('#monthly-result').addEventListener('change',()=>renderMonthlyReport().catch(e=>toast(e.message,true)));
$('#monthly-status').addEventListener('change',()=>renderMonthlyReport().catch(e=>toast(e.message,true)));

function setPreset(kind){const today=businessToday();let start=new Date(today);if(kind==='weekly'){const day=(today.getDay()+6)%7;start.setDate(today.getDate()-day);}if(kind==='monthly')start=new Date(`${state.calendar?.month_start||isoLocal(new Date(today.getFullYear(),today.getMonth(),1))}T12:00:00`);const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;if(kind!=='custom'){$('#report-start').value=iso(start);$('#report-end').value=iso(today);}} $$('.report-preset').forEach(b=>b.addEventListener('click',async()=>{setPreset(b.dataset.period);if(b.dataset.period!=='custom')await renderReport();}));$('#dashboard-report').addEventListener('click',()=>{setPreset('daily');navigate('reports');});
function reportQuery(){return new URLSearchParams({start:$('#report-start').value,end:$('#report-end').value,scope:$('#report-scope').value,agent:$('#global-agent').value,language:state.language});}
async function renderReport(){if(!$('#report-start').value)setPreset('daily');const data=await api(`${prefix()}/reports/range?${reportQuery()}`);const metrics=[[data.new_quotes,t('added_today')],[data.quotes_reviewed,t('reviewed')],[data.status_changes,t('status_changes')],[data.po_changes,t('converted_po')]];const financial=[[data.pending_value,t('pending_total')],[data.po_quoted_value,t('quoted_total')],[data.po_value,t('po_total')],[Number(data.po_value)-Number(data.po_quoted_value),'Variance']];const maxPo=Math.max(1,...data.po_rows.flatMap(r=>[Number(r.quoted_total||0),Number(r.po_total||0)]));$('#report-summary').innerHTML=`<h3>${t('details')}</h3><div class="report-kpis">${metrics.map(([v,l])=>`<div><strong>${v}</strong><span>${l}</span></div>`).join('')}</div><h3>${t('financial_summary')}</h3><div class="report-kpis financial">${financial.map(([v,l])=>`<div><strong>${money(v)}</strong><span>${l}</span></div>`).join('')}</div><div class="report-grid"><section><h3>${t('loss_breakdown')}</h3>${Object.keys(data.loss_breakdown).length?Object.entries(data.loss_breakdown).map(([r,v])=>`<div class="reason-row"><span>${esc(r)}</span><b>${v}</b></div>`).join(''):`<p class="muted">${t('no_records')}</p>`}</section><section><h3>${t('po_comparison')}</h3><div class="comparison-chart">${data.po_rows.slice(0,8).map(r=>`<div class="comparison-item"><div><i class="qt" style="height:${Math.max(2,90*Number(r.quoted_total||0)/maxPo)}px"></i><i class="po" style="height:${Math.max(2,90*Number(r.po_total||0)/maxPo)}px"></i></div><small>${esc(r.folio)}</small><span>${fmtDate(r.po_date)}</span></div>`).join('')||`<p class="muted">${t('no_records')}</p>`}</div></section></div>`;const base=`${prefix()}/reports/export`;const q=reportQuery();$('#report-pdf').href=`${base}.pdf?${q}`;$('#report-xlsx').href=`${base}.xlsx?${q}`;}
$('#report-preview').addEventListener('click',()=>renderReport().catch(e=>toast(e.message,true)));$('#report-scope').addEventListener('change',()=>renderReport().catch(e=>toast(e.message,true)));

$('#upload-button').addEventListener('click',()=>{state.importToken=null;$('#upload-file').value='';$('#upload-file').accept=state.system==='special'?'.xlsx':'.xlsx,.txt';$('#import-preview').classList.add('hidden');$('#confirm-import').classList.add('hidden');$('#preview-import').classList.remove('hidden');$('#upload-title').textContent=state.system==='special'?'Upload Special Quotations':'Upload Follow Up Quotations';$('#upload-help').textContent=state.system==='special'?'B date, E company, F rank, G item code, H model, I quantity, J unit price, and AA NT Tool agent. Values remain in JPY.':'Upload the daily Excel or tab-delimited TXT report. A date, B series, C folio, D distributor, E total with tax, F End User, G distributor agent, I customer order, J NT Tool agent, and K internal net total. Values remain in USD.';$('#upload-dialog').showModal();});
function toBase64(buffer){let binary='';const bytes=new Uint8Array(buffer);for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(binary);}
$('#upload-form').addEventListener('submit',async e=>{e.preventDefault();const file=$('#upload-file').files[0];if(!file)return;const button=$('#preview-import');button.disabled=true;try{const data=await api(`${prefix()}/import/preview`,{method:'POST',body:JSON.stringify({filename:file.name,content_base64:toBase64(await file.arrayBuffer())})});state.importToken=data.token;$('#import-preview').classList.remove('hidden');$('#import-preview').innerHTML=`<div class="preview-metrics"><div><b>${data.rows_seen}</b><span>${t('rows')}</span></div><div><b>${data.new}</b><span>${t('new')}</span></div><div><b>${data.updated}</b><span>${t('updated')}</span></div><div><b>${data.unchanged||0}</b><span>${t('unchanged')}</span></div><div><b>${data.duplicates}</b><span>${t('duplicates')}</span></div><div><b>${data.archived||0}</b><span>${t('excluded')}</span></div><div><b>${data.errors}</b><span>${t('invalid')}</span></div></div>${data.error_detail?.length?`<div class="form-error">${data.error_detail.map(x=>`Row ${x.row}: ${esc(x.error)}`).join('<br>')}</div>`:''}`;$('#confirm-import').classList.remove('hidden');button.classList.add('hidden');}catch(err){toast(err.message,true);}finally{button.disabled=false;}});
$('#confirm-import').addEventListener('click',async()=>{if(!state.importToken)return;const button=$('#confirm-import');button.disabled=true;try{const data=await api(`${prefix()}/import/confirm`,{method:'POST',body:JSON.stringify({token:state.importToken})});$('#upload-dialog').close();toast(`${t('import_complete')}: ${data.inserted} ${t('new')}, ${data.updated} ${t('updated')}, ${data.unchanged||0} ${t('unchanged')}`);await loadAgents();await navigate('management');}catch(err){toast(err.message,true);}finally{button.disabled=false;}});

async function renderUsers(){const users=await api('/api/users');state.users=users;$('#users-table').innerHTML=`<table><thead><tr><th></th><th>${t('username')}</th><th>${t('display_name')}</th><th>${t('agent')}</th><th>${t('active')}</th></tr></thead><tbody>${users.map(u=>`<tr><td><button class="button primary edit-user" data-id="${u.id}">${t('edit_user')}</button></td><td class="folio">${esc(u.username)}</td><td>${esc(u.display_name)}</td><td>${esc(u.agent_name)}</td><td>${u.active?'✓':'—'}</td></tr>`).join('')}</tbody></table>`;const panel=$('#audit-panel');panel.classList.toggle('hidden',!state.me.can_view_audit);if(state.me.can_view_audit){const audit=await api('/api/audit?limit=100');$('#audit-table').innerHTML=`<table><thead><tr><th>${t('date')}</th><th>${t('user')}</th><th>Action</th><th>${t('details')}</th></tr></thead><tbody>${audit.map(a=>`<tr><td>${fmtDT(a.created_at)}</td><td>${esc(a.user_name)}${a.emergency_admin?' <span class="warning-badge">Emergency</span>':''}</td><td>${esc(a.action)}</td><td>${esc(a.detail)}</td></tr>`).join('')}</tbody></table>`;}else{$('#audit-table').innerHTML='';}$$('.edit-user').forEach(b=>b.addEventListener('click',()=>openUser(Number(b.dataset.id))));}
function temporaryPassword(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';const bytes=new Uint32Array(14);crypto.getRandomValues(bytes);return [...bytes].map(n=>chars[n%chars.length]).join('');}
function putTemporaryPassword(selector){const input=$(selector);input.value=temporaryPassword();input.focus();input.select();}$('#generate-new-password').addEventListener('click',()=>putTemporaryPassword('#new-password'));
$('#generate-edit-password').addEventListener('click',()=>putTemporaryPassword('#edit-password'));
$('#user-form').addEventListener('submit',async e=>{e.preventDefault();try{await api('/api/users',{method:'POST',body:JSON.stringify({username:$('#new-username').value,display_name:$('#new-display-name').value,agent_name:$('#new-agent').value,password:$('#new-password').value,language:state.language})});e.target.reset();toast(t('create_user'));await renderUsers();}catch(err){toast(err.message,true);}});
function openUser(id) {
    const u = state.users.find(x => Number(x.id) === Number(id));
    if (!u) return toast('User not found', true);
    
    $('#edit-user-id').value = id;
    $('#edit-username').textContent = `@${u.username}`;
    $('#edit-name').value = u.display_name || '';
    $('#edit-agent').value = u.agent_name || '';
    $('#edit-active').checked = !!u.active;
    $('#edit-password').value = '';

    if (!$('#user-edit-dialog').open) $('#user-edit-dialog').showModal();
}

$('#user-edit-form').addEventListener('submit', async e => {
    e.preventDefault();
    try {
        const password = $('#edit-password').value;
        const payload = {
            display_name: $('#edit-name').value,
            agent_name: $('#edit-agent').value,
            active: $('#edit-active').checked,
            password: password
        };
        await api(`/api/users/${$('#edit-user-id').value}`, {
            method: 'PATCH',
            body: JSON.stringify(payload)
        });
        
        $('#user-edit-dialog').close();
        toast(password ? (state.language === 'es' ? 'Contraseña temporal guardada' : 'Temporary password saved') : t('save'));
        await renderUsers();
    } catch (err) {
        toast(err.message, true);
    }
});
$('#password-button').addEventListener('click',()=>{$('#password-notice').textContent='';$('#password-form').reset();$('#password-dialog').showModal();});
$('#password-form').addEventListener('submit',async e=>{e.preventDefault();try{await api('/api/me/password',{method:'PATCH',body:JSON.stringify({current_password:$('#current-password').value,new_password:$('#new-own-password').value})});state.me.must_change_password=0;$('#password-dialog').close();toast(t('change_password'));}catch(err){toast(err.message,true);}});  $$('.dialog-close').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));

(async function init(){try{const status=await api('/api/auth/status');const me=await api('/api/me').catch(()=>null);if(me){state.me=me;state.language=me.language||'en';$('#login-language').value=state.language;await enterApp(me);}else showLogin(status.bootstrap_required);}catch(e){showLogin(false);$('#login-error').textContent=e.message;}})();


// Invoice Excel/TXT import for confirmed USD purchase orders.
const btnOpenInvoices=$('#btn-open-invoices');
const invoiceDialog=$('#invoice-dialog');
const invoiceForm=$('#invoice-form');
const invoiceFile=$('#invoice-file');
const invoicePreviewContainer=$('#invoice-preview-container');
const previewInvoiceBtn=$('#preview-invoice-btn');
const confirmInvoiceBtn=$('#confirm-invoice-btn');
let currentInvoiceToken=null;

function invoiceImportStatus(status){
  const labels={
    new:state.language==='es'?'Nueva':'New',
    duplicate:state.language==='es'?'Duplicada':'Duplicate',
    unmatched:state.language==='es'?'Sin cotización':'No matching quotation',
    not_po:state.language==='es'?'Fuera de PO sin fecha':'Not in PO Date Missing',
    ambiguous:state.language==='es'?'PO ambigua':'Ambiguous PO',
    conflict:state.language==='es'?'Factura en conflicto':'Conflicting invoice',
  };
  return labels[status]||status;
}
function renderInvoiceImportPreview(result) {
  // Función para contar los datos correctamente sin importar si Python manda un número o una lista enorme
  const getCount = (val) => Array.isArray(val) ? val.length : (val || 0);

  const countNew = getCount(result.new);
  const countDup = getCount(result.duplicate);
  const countUnmatched = getCount(result.unmatched);
  const countNotPo = getCount(result.not_po);
  const countAmbiguous = getCount(result.ambiguous);
  const countInvalid = getCount(result.invalid);

  const htmlResumen = `
  <div style="padding: 10px; width: 100%; color: #333;">
      <h3 style="margin-top:0; text-align: center; color: #2e7d32; font-size: 18px;">
          ${state.language==='es' ? 'Resumen de Sincronización' : 'Synchronization Summary'}
      </h3>
      <p style="font-size: 13px; text-align: center; color: #666; margin-bottom: 20px;">
          ${state.language==='es' ? 
          'Revisa los totales antes de inyectar las facturas a las PO sin fecha.' : 
          'Review the totals before injecting invoices into PO Date Missing.'}
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <tr style="border-bottom: 2px solid #ddd;">
              <th style="text-align: left; padding: 6px 0;">${state.language==='es' ? 'Categoría' : 'Category'}</th>
              <th style="text-align: right; padding: 6px 0;">${state.language==='es' ? 'Total' : 'Total'}</th>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px 0;">🟢 ${state.language==='es' ? 'Nuevas (Listas)' : 'New (Ready)'}</td>
              <td style="text-align: right; font-weight: bold;">${countNew}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px 0;">🟡 ${state.language==='es' ? 'Duplicadas' : 'Duplicates'}</td>
              <td style="text-align: right; font-weight: bold;">${countDup}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px 0;">⚪ ${state.language==='es' ? 'Sin coincidencia' : 'Unmatched'}</td>
              <td style="text-align: right; font-weight: bold;">${countUnmatched}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px 0;">🟠 ${state.language==='es' ? 'Fuera de PO / No confirmadas' : 'Not PO Date Missing'}</td>
              <td style="text-align: right; font-weight: bold;">${countNotPo}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px 0;">🟣 ${state.language==='es' ? 'Ambiguas' : 'Ambiguous'}</td>
              <td style="text-align: right; font-weight: bold;">${countAmbiguous}</td>
          </tr>
          <tr>
              <td style="padding: 8px 0;">🔴 ${state.language==='es' ? 'Inválidas' : 'Invalid'}</td>
              <td style="text-align: right; font-weight: bold;">${countInvalid}</td>
          </tr>
      </table>
  </div>`;

  invoicePreviewContainer.innerHTML = htmlResumen;
}

btnOpenInvoices?.addEventListener('click',()=>{
  if(state.system!=='standard')return toast(state.language==='es'?'La importación de facturas está disponible en Follow Up Quotations.':'Invoice import is available in Follow Up Quotations.',true);
  currentInvoiceToken=null;
  invoiceForm.reset();
  invoicePreviewContainer.innerHTML='';
  invoicePreviewContainer.classList.add('hidden');
  confirmInvoiceBtn.classList.add('hidden');
  confirmInvoiceBtn.disabled=false;
  previewInvoiceBtn.classList.remove('hidden');
  invoiceFile.disabled=false;
  invoiceDialog.showModal();
});

invoiceForm?.addEventListener('submit',async event=>{
  event.preventDefault();
  const file=invoiceFile.files[0];
  if(!file)return;
  const originalText=previewInvoiceBtn.textContent;
  previewInvoiceBtn.textContent=state.language==='es'?'Leyendo...':'Reading...';
  previewInvoiceBtn.disabled=true;
  try{
    const result=await api('/api/import/invoices/preview',{
      method:'POST',
      body:JSON.stringify({content_base64:toBase64(await file.arrayBuffer()),filename:file.name}),
    });
    currentInvoiceToken=result.token;
    renderInvoiceImportPreview(result);
    invoicePreviewContainer.classList.remove('hidden');
    previewInvoiceBtn.classList.add('hidden');
    confirmInvoiceBtn.classList.remove('hidden');
    confirmInvoiceBtn.disabled= (Array.isArray(result.new)? result.new.length : Number(result.new || 0)) ===0;
    invoiceFile.disabled=true;
  }catch(error){
    toast(error.message,true);
  }finally{
    previewInvoiceBtn.textContent=originalText;
    previewInvoiceBtn.disabled=false;
  }
});

confirmInvoiceBtn?.addEventListener('click',async()=>{
  if(!currentInvoiceToken)return;
  const originalText=confirmInvoiceBtn.textContent;
  confirmInvoiceBtn.textContent=state.language==='es'?'Guardando...':'Saving...';
  confirmInvoiceBtn.disabled=true;
  try{
    const result=await api('/api/import/invoices/confirm',{
      method:'POST',
      body:JSON.stringify({token:currentInvoiceToken}),
    });
    invoiceDialog.close();
    toast(state.language==='es'?`${result.invoices_added} facturas agregadas a ${result.quotes_updated} cotizaciones PO.`:result.message);
    await navigate(state.view);
  }catch(error){
    toast(error.message,true);
  }finally{
    confirmInvoiceBtn.textContent=originalText;
    confirmInvoiceBtn.disabled=false;
  }
});


// ==========================================
// MÓDULO DIRECTORIO CORPORATIVO & ESCÁNER IA
// ==========================================
state.directorio = {
  contacts: [],
  catalogs: { empresas: [], ubicaciones: [] },
  viewMode: 'grid',
  search: '',
  empresa: '',
  ubicacion: '',
  currentScanBase64: null
};

async function renderDirectorio() {
  try {
    const [cats, contacts] = await Promise.all([
      api('/api/directorio/catalogos'),
      api('/api/directorio/contactos')
    ]);
    state.directorio.catalogs = cats || { empresas: [], ubicaciones: [] };
    state.directorio.contacts = contacts || [];

    // Llenar selects y datalists de empresa
    const empSelect = $('#directorio-filter-empresa');
    if (empSelect) {
      const currentVal = empSelect.value;
      empSelect.innerHTML = '<option value="">🏢 Todas las Empresas</option>' +
        state.directorio.catalogs.empresas.map(e => `<option value="${esc(e.nombre)}">${esc(e.nombre)}</option>`).join('');
      empSelect.value = currentVal;
    }

    const dlEmp = $('#datalist-empresas');
    if (dlEmp) {
      const activeEmps = Array.from(new Set(
        (state.directorio.contacts || []).map(c => c.empresa_display || c.empresa_nombre).filter(Boolean)
      )).sort((a, b) => a.localeCompare(b, 'es'));
      dlEmp.innerHTML = activeEmps.map(name => `<option value="${esc(name)}">`).join('');
    }

    const dlUbi = $('#datalist-ubicaciones');
    if (dlUbi) {
      dlUbi.innerHTML = state.directorio.catalogs.ubicaciones.map(u => `<option value="${esc(u.estado)}, ${esc(u.pais)}">`).join('');
    }

    // Poblar selector dependiente de ubicaciones nacionales
    const ubiNacSelect = $('#directorio-filter-ubicacion-nacional');
    if (ubiNacSelect) {
      const currentNac = state.directorio.ubicacionNacional || '';
      const nacStates = new Set();
      (state.directorio.catalogs?.ubicaciones || [])
        .filter(u => u.tipo === 'Nacional' && u.estado)
        .forEach(u => nacStates.add(u.estado.trim()));
      (state.directorio.contacts || [])
        .filter(c => (c.ubicacion_tipo || 'Nacional') === 'Nacional')
        .forEach(c => {
          const raw = (c.ubicacion_display || c.ubicacion_texto || '').trim();
          if (raw) {
            const parts = raw.split(',').map(p => p.trim()).filter(Boolean);
            if (parts.length > 0) {
              const stateCandidate = (parts.length >= 2 && parts[parts.length - 1].toLowerCase().includes('m'))
                ? parts[parts.length - 2]
                : parts[0];
              if (stateCandidate) nacStates.add(stateCandidate);
            }
          }
        });

      const sortedStates = Array.from(nacStates).sort((a, b) => a.localeCompare(b, 'es'));
      ubiNacSelect.innerHTML = `<option value="">📍 Todos los Estados / Ciudades (Nacional)</option>` +
        sortedStates.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
      ubiNacSelect.value = currentNac;

      if (state.directorio.ubicacion === 'Nacional') {
        ubiNacSelect.classList.remove('hidden');
      } else {
        ubiNacSelect.classList.add('hidden');
      }
    }

    filterAndDisplayDirectorio();
  } catch (err) {
    toast('Error al cargar directorio: ' + err.message, true);
  }
}

function cleanPhoneForWa(phone) {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 10) digits = '52' + digits;
  return digits;
}

function filterAndDisplayDirectorio() {
  const query = (state.directorio.search || '').toLowerCase().trim();
  const filterEmp = state.directorio.empresa;
  const filterUbi = state.directorio.ubicacion;

  const filterUbiNac = state.directorio.ubicacionNacional;

  const filtered = state.directorio.contacts.filter(c => {
    if (filterEmp && (c.empresa_display !== filterEmp && c.empresa_nombre !== filterEmp)) return false;
    if (filterUbi && filterUbi !== 'Todos') {
      const uType = c.ubicacion_tipo || 'Nacional';
      if (uType !== filterUbi) return false;
    }
    if (filterUbi === 'Nacional' && filterUbiNac) {
      const uBlob = `${c.ubicacion_display || ''} ${c.ubicacion_texto || ''} ${c.direccion || ''}`.toLowerCase();
      if (!uBlob.includes(filterUbiNac.toLowerCase())) return false;
    }
    if (query) {
      const blob = `${c.nombre_completo || ''} ${c.puesto || ''} ${c.correo || ''} ${c.telefono || ''} ${c.telefono_2 || ''} ${c.empresa_display || ''} ${c.ubicacion_display || ''}`.toLowerCase();
      if (!blob.includes(query)) return false;
    }
    return true;
  });

  $('#dir-total-count').textContent = filtered.length;
  const uniqueEmps = new Set(filtered.map(c => c.empresa_display).filter(Boolean));
  $('#dir-emp-count').textContent = uniqueEmps.size;

  const gridWrap = $('#directorio-grid-wrap');
  const tableWrap = $('#directorio-table-wrap');

  if (state.directorio.viewMode === 'grid') {
    gridWrap.classList.remove('hidden');
    tableWrap.classList.add('hidden');
    renderDirectorioCards(filtered);
  } else {
    gridWrap.classList.add('hidden');
    tableWrap.classList.remove('hidden');
    renderDirectorioTable(filtered);
  }
}

function renderDirectorioCards(contacts) {
  const container = $('#directorio-grid-wrap');
  if (!contacts.length) {
    container.innerHTML = '<div class="panel" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--muted);"><p style="font-size: 16px;">No se encontraron contactos registrados.</p></div>';
    return;
  }

  const isAdmin = state.me?.role !== 'readonly';

  container.innerHTML = contacts.map(c => {
    const initials = (c.nombre_completo || 'C').split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();
    const logoUrl = getCompanyLogoUrl(c);
    const waNumber = cleanPhoneForWa(c.telefono || c.telefono_2);
    const telClean = (c.telefono || c.telefono_2 || '').replace(/[^0-9+]/g, '');

    return `
      <div class="contact-card" data-id="${c.id_contacto}">
        <div>
          <div class="contact-card-top">
            <div class="contact-avatar ${logoUrl ? '' : 'avatar-text'}">
              ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="contact-logo-img" loading="lazy" onerror="this.parentElement.classList.add('avatar-text'); this.parentElement.innerHTML='${esc(initials)}';">` : esc(initials)}
            </div>
            <div class="contact-main-info">
              <h3 class="contact-name" title="Ver ficha de ${esc(c.nombre_completo)}">
                <button type="button" class="btn-name-link view-contact-dossier" data-id="${c.id_contacto}">
                  ${esc(c.nombre_completo)}
                </button>
              </h3>
              <p class="contact-puesto">${esc(c.puesto || 'Puesto no asignado')}</p>
              <div class="contact-badges">
                ${c.empresa_display ? `<span class="badge-empresa">🏢 ${esc(c.empresa_display)}</span>` : ''}
                ${c.ubicacion_tipo ? `<span class="badge-ubi ${c.ubicacion_tipo.toLowerCase()}">${c.ubicacion_tipo === "Nacional" ? "🇲🇽 Nacional" : "🌐 Internacional"}</span>` : ""}${c.ubicacion_display ? `<span class="badge-ubi">📍 ${esc(c.ubicacion_display)}</span>` : ""}
              </div>
            </div>
          </div>

          <div class="contact-card-details">
            ${c.telefono ? `<div class="detail-item"><span>📞</span><strong>${esc(c.telefono)}</strong></div>` : ''}
            ${c.telefono_2 ? `<div class="detail-item"><span>📱</span><span>${esc(c.telefono_2)}</span></div>` : ''}
            ${c.correo ? `<div class="detail-item"><span>✉️</span><a href="mailto:${esc(c.correo)}">${esc(c.correo)}</a></div>` : ''}
            ${c.sitio_web ? `<div class="detail-item"><span>🌐</span><a href="${esc(formatWebUrl(c.sitio_web))}" target="_blank" rel="noopener">${esc(c.sitio_web.replace(/^https?:\/\//i, ''))}</a></div>` : ''}
            ${c.direccion ? `<div class="detail-item" title="${esc(c.direccion)}"><span>🏠</span><span>${esc(c.direccion)}</span></div>` : ''}
            ${c.notas ? `<div class="detail-item" style="color:var(--muted); font-style:italic;" title="${esc(c.notas)}"><span>📝</span><span>${esc(c.notas)}</span></div>` : ''}
          </div>
        </div>

        <div class="contact-quick-actions">${(c.foto_tarjeta || c.foto_tarjeta_reverso) ? `<button type="button" class="btn-action-round btn-act-photo view-card-photo" data-photo="${esc(c.foto_tarjeta || '')}" data-back="${esc(c.foto_tarjeta_reverso || '')}" data-title="${esc(c.nombre_completo)}" title="Ver Tarjeta Física Original">📷</button>` : ""}
          ${waNumber ? `<a href="https://wa.me/${waNumber}" target="_blank" rel="noopener" class="btn-action-round btn-act-wa" title="Abrir WhatsApp">💬</a>` : ''}
          ${telClean ? `<a href="tel:${telClean}" class="btn-action-round btn-act-call" title="Llamar">📞</a>` : ''}
          ${c.correo ? `<a href="mailto:${esc(c.correo)}" class="btn-action-round btn-act-email" title="Enviar Correo">✉️</a>` : ''}
          <a href="/api/directorio/vcard/${c.id_contacto}" class="btn-action-round btn-act-vcard" title="Descargar Contacto vCard para Celular / Outlook">📇</a>

          <div class="btn-action-more">
            <button type="button" class="btn-act-sm btn-edit-contact" data-id="${c.id_contacto}" title="Editar">✏️</button>
            ${isAdmin ? `<button type="button" class="btn-act-sm danger btn-del-contact" data-id="${c.id_contacto}" title="Borrar">🗑️</button>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  wireDirectorioEvents();
}

function renderDirectorioTable(contacts) {
  const container = $('#directorio-table-wrap');
  if (!contacts.length) {
    container.innerHTML = '<p class="muted" style="padding:20px; text-align:center;">No hay contactos.</p>';
    return;
  }

  const isAdmin = state.me?.role !== 'readonly';

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Contacto</th>
          <th>Empresa</th>
          <th>Teléfono(s)</th>
          <th>Correo</th>
          <th>Ubicación</th>
          <th style="text-align:right;">Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${contacts.map(c => {
          const waNumber = cleanPhoneForWa(c.telefono || c.telefono_2);
          const telClean = (c.telefono || c.telefono_2 || '').replace(/[^0-9+]/g, '');
          return `
            <tr>
              <td>
                <strong><button type="button" class="btn-name-link view-contact-dossier" data-id="${c.id_contacto}" title="Ver ficha">${esc(c.nombre_completo)}</button></strong>
                ${c.puesto ? `<div class="section-help" style="margin:0;">${esc(c.puesto)}</div>` : ''}
              </td>
              <td>${esc(c.empresa_display || '-')}</td>
              <td>
                ${c.telefono ? `<div>${esc(c.telefono)}</div>` : ''}
                ${c.telefono_2 ? `<div class="muted">${esc(c.telefono_2)}</div>` : ''}
              </td>
              <td>${c.correo ? `<a href="mailto:${esc(c.correo)}">${esc(c.correo)}</a>` : '-'}</td>
              <td>${esc(c.ubicacion_display || '-')}</td>
              <td style="text-align:right; white-space:nowrap;">
                ${(c.foto_tarjeta || c.foto_tarjeta_reverso) ? `<button type="button" class="button ghost view-card-photo" data-photo="${esc(c.foto_tarjeta || '')}" data-back="${esc(c.foto_tarjeta_reverso || '')}" data-title="${esc(c.nombre_completo)}" style="padding:4px 8px; font-size:12px; margin-right:4px;" title="Ver Tarjeta">📷</button>` : ''}${waNumber ? `<a href="https://wa.me/${waNumber}" target="_blank" rel="noopener" class="button ghost" style="padding:4px 8px; font-size:12px; margin-right:4px;">💬 WA</a>` : ''}
                <a href="/api/directorio/vcard/${c.id_contacto}" class="button ghost" style="padding:4px 8px; font-size:12px; margin-right:4px;" title="vCard">📇</a>
                <button type="button" class="button ghost btn-edit-contact" data-id="${c.id_contacto}" style="padding:4px 8px; font-size:12px;">✏️</button>
                ${isAdmin ? `<button type="button" class="button ghost danger-btn btn-del-contact" data-id="${c.id_contacto}" style="padding:4px 8px; font-size:12px; margin-left:4px;">🗑️</button>` : ''}
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  wireDirectorioEvents();
}

function openCardPhotoViewer(title, front, back) {
  const dialog = $('#dialog-card-photo');
  const img = $('#card-photo-viewer-img');
  const toolbar = $('#card-photo-toolbar');
  const btnFront = $('#btn-photo-show-front');
  const btnBack = $('#btn-photo-show-back');
  const titleEl = $('#card-photo-viewer-title');

  if (titleEl) titleEl.textContent = title ? `Tarjeta: ${title}` : 'Tarjeta de Presentación';

  let currentSide = front ? 'front' : 'back';
  if (img) img.src = front || back || '';

  if (front && back) {
    if (toolbar) toolbar.classList.remove('hidden');
    const updateButtons = () => {
      btnFront?.classList.toggle('active', currentSide === 'front');
      btnBack?.classList.toggle('active', currentSide === 'back');
      if (img) img.src = currentSide === 'front' ? front : back;
    };
    if (btnFront) btnFront.onclick = () => { currentSide = 'front'; updateButtons(); };
    if (btnBack) btnBack.onclick = () => { currentSide = 'back'; updateButtons(); };
    updateButtons();
  } else {
    if (toolbar) toolbar.classList.add('hidden');
  }

  if (dialog) dialog.showModal();
}

function wireDirectorioEvents() {
  $$('.btn-edit-contact').forEach(b => {
    b.onclick = () => openEditContact(Number(b.dataset.id));
  });

  $$('.btn-del-contact').forEach(b => {
    b.onclick = () => confirmDeleteContact(Number(b.dataset.id));
  });

  $$('.view-card-photo').forEach(b => {
    b.onclick = () => {
      const front = b.dataset.photo;
      const back = b.dataset.back;
      const title = b.dataset.title;
      openCardPhotoViewer(title, front, back);
    };
  });

  $$('.view-contact-dossier').forEach(b => {
    b.onclick = () => openViewContactDossier(Number(b.dataset.id));
  });
}

function openEditContact(id) {
  const c = state.directorio.contacts.find(x => x.id_contacto === id);
  if (!c) return;

  $('#contact-id').value = c.id_contacto;
  $('#contact-dialog-title').textContent = 'Editar Contacto';
  $('#btn-delete-contact-from-modal')?.classList.remove('hidden');
  state.directorio.currentCardPhotoToSave = c.foto_tarjeta || '';
  state.directorio.currentBackCardPhotoToSave = c.foto_tarjeta_reverso || '';
  $('#contact-nombre').value = c.nombre_completo || '';
  $('#contact-puesto').value = c.puesto || '';
  $('#contact-empresa-nombre').value = c.empresa_display || c.empresa_nombre || '';
  $('#contact-correo').value = c.correo || '';
  $('#contact-web').value = c.sitio_web || '';
  $('#contact-tel1').value = c.telefono || '';
  $('#contact-tel2').value = c.telefono_2 || '';
  $('#contact-ubicacion-texto').value = c.ubicacion_display || c.ubicacion_texto || '';
  setContactUbiType(c.ubicacion_tipo || 'Nacional');
  $('#contact-direccion').value = c.direccion || '';
  $('#contact-notas').value = c.notas || '';

  $('#dialog-contacto').showModal();
}

function confirmAction({ title = '¿Estás seguro?', message = '', confirmText = 'Confirmar', danger = false }) {
  return new Promise((resolve) => {
    const dialog = $('#dialog-confirm-action');
    if (!dialog) {
      resolve(true);
      return;
    }
    const titleEl = $('#confirm-dialog-title');
    const msgEl = $('#confirm-dialog-message');
    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.innerHTML = message;

    const btnConfirm = $('#confirm-dialog-ok');
    const btnCancel = $('#confirm-dialog-cancel');

    if (btnConfirm) {
      btnConfirm.textContent = confirmText;
      btnConfirm.className = danger ? 'button danger-btn' : 'button primary';
    }

    const handleConfirm = () => {
      cleanup();
      dialog.close();
      resolve(true);
    };
    const handleCancel = () => {
      cleanup();
      dialog.close();
      resolve(false);
    };

    function cleanup() {
      btnConfirm?.removeEventListener('click', handleConfirm);
      btnCancel?.removeEventListener('click', handleCancel);
      dialog.removeEventListener('cancel', handleCancel);
    }

    btnConfirm?.addEventListener('click', handleConfirm);
    btnCancel?.addEventListener('click', handleCancel);
    dialog.addEventListener('cancel', handleCancel);

    dialog.showModal();
  });
}

async function confirmDeleteContact(id) {
  const c = state.directorio.contacts.find(x => x.id_contacto === id);
  const name = c ? c.nombre_completo : 'este contacto';

  const confirmed = await confirmAction({
    title: '¿Eliminar Contacto?',
    message: `¿Estás seguro de que deseas eliminar a <strong>${esc(name)}</strong>?<br><span style="color:var(--muted); font-size:12px; display:inline-block; margin-top:4px;">Esta acción no se puede deshacer.</span>`,
    confirmText: '🗑️ Sí, Eliminar',
    danger: true
  });
  if (!confirmed) return;

  try {
    await api(`/api/directorio/contactos/${id}/delete`, { method: 'POST' });
    toast('Contacto eliminado exitosamente');
    await renderDirectorio();
  } catch (err) {
    toast(err.message, true);
  }
}

// Búsqueda reactiva con debounce
let dirSearchTimeout;
const dirSearchInput = $('#directorio-search');
if (dirSearchInput) {
  dirSearchInput.addEventListener('input', () => {
    clearTimeout(dirSearchTimeout);
    dirSearchTimeout = setTimeout(() => {
      state.directorio.search = dirSearchInput.value;
      filterAndDisplayDirectorio();
    }, 150);
  });
}

const dirFilterEmp = $('#directorio-filter-empresa');
if (dirFilterEmp) {
  dirFilterEmp.addEventListener('change', () => {
    state.directorio.empresa = dirFilterEmp.value;
    filterAndDisplayDirectorio();
  });
}

const dirFilterUbi = $('#directorio-filter-ubicacion');
const dirFilterUbiNac = $('#directorio-filter-ubicacion-nacional');

if (dirFilterUbi) {
  dirFilterUbi.addEventListener('change', () => {
    state.directorio.ubicacion = dirFilterUbi.value;
    if (dirFilterUbi.value === 'Nacional') {
      if (dirFilterUbiNac) dirFilterUbiNac.classList.remove('hidden');
    } else {
      if (dirFilterUbiNac) {
        dirFilterUbiNac.classList.add('hidden');
        dirFilterUbiNac.value = '';
      }
      state.directorio.ubicacionNacional = '';
    }
    filterAndDisplayDirectorio();
  });
}

if (dirFilterUbiNac) {
  dirFilterUbiNac.addEventListener('change', () => {
    state.directorio.ubicacionNacional = dirFilterUbiNac.value;
    filterAndDisplayDirectorio();
  });
}

// Toggles de vista Tarjetas / Tabla
const btnGrid = $('#btn-dir-view-grid');
const btnTable = $('#btn-dir-view-table');
if (btnGrid && btnTable) {
  btnGrid.addEventListener('click', () => {
    btnGrid.classList.add('active');
    btnTable.classList.remove('active');
    state.directorio.viewMode = 'grid';
    filterAndDisplayDirectorio();
  });
  btnTable.addEventListener('click', () => {
    btnTable.classList.add('active');
    btnGrid.classList.remove('active');
    state.directorio.viewMode = 'table';
    filterAndDisplayDirectorio();
  });
}

// Botón Nuevo Contacto
const btnNewContact = $('#btn-new-contact');
if (btnNewContact) {
  btnNewContact.addEventListener('click', () => {
    $('#contact-id').value = '';
    $('#contact-dialog-title').textContent = 'Nuevo Contacto';
    $('#btn-delete-contact-from-modal')?.classList.add('hidden');
    state.directorio.currentCardPhotoToSave = '';
    state.directorio.currentBackCardPhotoToSave = '';
    $('#form-contacto').reset();
    setContactUbiType('Nacional');
    $('#dialog-contacto').showModal();
  });
}

// Envío del Formulario de Contacto
function setContactUbiType(type = 'Nacional') {
  const norm = type === 'Internacional' ? 'Internacional' : 'Nacional';
  const input = $('#contact-ubicacion-tipo');
  if (input) input.value = norm;
  const btnNac = $('#btn-ubi-nacional');
  const btnInt = $('#btn-ubi-internacional');
  if (btnNac && btnInt) {
    btnNac.classList.toggle('active', norm === 'Nacional');
    btnInt.classList.toggle('active', norm === 'Internacional');
  }
}

const btnUbiNac = $('#btn-ubi-nacional');
const btnUbiInt = $('#btn-ubi-internacional');
if (btnUbiNac && btnUbiInt) {
  btnUbiNac.addEventListener('click', (e) => { e.preventDefault(); setContactUbiType('Nacional'); });
  btnUbiInt.addEventListener('click', (e) => { e.preventDefault(); setContactUbiType('Internacional'); });
}

const formContacto = $('#form-contacto');
if (formContacto) {
  formContacto.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      id_contacto: $('#contact-id').value ? Number($('#contact-id').value) : null,
      nombre_completo: $('#contact-nombre').value,
      puesto: $('#contact-puesto').value,
      empresa_nombre: $('#contact-empresa-nombre').value,
      correo: $('#contact-correo').value,
      sitio_web: $('#contact-web').value,
      telefono: $('#contact-tel1').value,
      telefono_2: $('#contact-tel2').value,
      ubicacion_texto: $('#contact-ubicacion-texto').value,
        ubicacion_tipo: $('#contact-ubicacion-tipo')?.value || 'Nacional',
      direccion: $('#contact-direccion').value,
      notas: $('#contact-notas').value,
      foto_tarjeta: state.directorio.currentCardPhotoToSave || '',
      foto_tarjeta_reverso: state.directorio.currentBackCardPhotoToSave || ''
    };

    try {
      await api('/api/directorio/contactos', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      state.directorio.currentCardPhotoToSave = '';
      state.directorio.currentBackCardPhotoToSave = '';
      $('#dialog-contacto').close();
      toast('Contacto guardado exitosamente');
      await renderDirectorio();
    } catch (err) {
      console.error('Detalle error escaneo:', err);
      toast(err.message, true);
    }
  });
}

// Administración de Catálogos
const btnManageCats = $('#btn-manage-catalogs');
if (btnManageCats) {
  btnManageCats.addEventListener('click', () => {
    $('#dialog-catalogo').showModal();
  });
}

const formNuevaEmp = $('#form-nueva-empresa');
if (formNuevaEmp) {
  formNuevaEmp.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('/api/directorio/empresas', {
        method: 'POST',
        body: JSON.stringify({
          nombre: $('#cat-emp-nombre').value,
          sector: $('#cat-emp-sector').value
        })
      });
      $('#cat-emp-nombre').value = '';
      $('#cat-emp-sector').value = '';
      toast('Empresa agregada');
      await renderDirectorio();
    } catch (err) {
      console.error('Detalle error escaneo:', err);
      toast(err.message, true);
    }
  });
}

const formNuevaUbi = $('#form-nueva-ubicacion');
if (formNuevaUbi) {
  formNuevaUbi.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('/api/directorio/ubicaciones', {
        method: 'POST',
        body: JSON.stringify({
          tipo: $('#cat-ubi-tipo').value,
          pais: $('#cat-ubi-pais').value,
          estado: $('#cat-ubi-estado').value
        })
      });
      $('#cat-ubi-pais').value = '';
      $('#cat-ubi-estado').value = '';
      toast('Ubicación agregada');
      await renderDirectorio();
    } catch (err) {
      console.error('Detalle error escaneo:', err);
      toast(err.message, true);
    }
  });
}

// ==========================================
// FLUJO ESCÁNER DE TARJETAS CON IA
// ==========================================
// FLUJO ESCÁNER DE TARJETAS (INDIVIDUAL Y POR LOTE)
// ==========================================
const btnOpenScan = $('#btn-open-scan');
const dialogScan = $('#dialog-scan-card');
const scanDropzone = $('#scan-dropzone');
const scanFileInput = $('#scan-file-input');
const scanCameraInput = $('#scan-camera-input');
const scanPreviewWrap = $('#scan-preview-wrap');
const scanPreviewImg = $('#scan-preview-img');
const scanRemoveImg = $('#scan-remove-img');
const scanBackFileInput = $('#scan-back-file-input');
const scanBackPreviewImg = $('#scan-back-preview-img');
const scanBackPlaceholder = $('#scan-back-placeholder');
const scanRemoveBackImg = $('#scan-remove-back-img');

const scanBatchWrap = $('#scan-batch-wrap');
const btnStartScan = $('#btn-start-ai-scan');
const btnStartBatch = $('#btn-start-batch-scan');
const btnCancelBatch = $('#batch-cancel-btn');
const scanAlert = $('#scan-status-alert');

function resetScanModal() {
  state.directorio.currentScanBase64 = null;
  state.directorio.currentBackScanBase64 = '';
  state.directorio.batchFiles = [];

  if (scanPreviewImg) scanPreviewImg.src = '';
  if (scanBackPreviewImg) {
    scanBackPreviewImg.src = '';
    scanBackPreviewImg.classList.add('hidden');
  }
  if (scanBackPlaceholder) scanBackPlaceholder.classList.remove('hidden');
  if (scanRemoveBackImg) scanRemoveBackImg.classList.add('hidden');
  if (scanBackFileInput) scanBackFileInput.value = '';

  const switchWrap = $('#scan-two-cards-switch-wrap');
  if (switchWrap) switchWrap.classList.add('hidden');

  if (scanPreviewWrap) scanPreviewWrap.classList.add('hidden');
  if (scanBatchWrap) scanBatchWrap.classList.add('hidden');

  const inner = $('.scan-dropzone-inner');
  if (inner) inner.classList.remove('hidden');
  if (scanAlert) scanAlert.classList.add('hidden');

  const progBox = $('#batch-progress-box');
  if (progBox) progBox.classList.add('hidden');

  if (btnStartScan) {
    btnStartScan.classList.remove('hidden');
    btnStartScan.disabled = true;
    btnStartScan.innerHTML = '⚡ Extraer Datos con IA';
  }
  if (btnStartBatch) {
    btnStartBatch.classList.add('hidden');
    btnStartBatch.disabled = false;
  }
}

function switchToBatchMode(files) {
  state.directorio.batchFiles = files;
  $('.scan-dropzone-inner')?.classList.add('hidden');
  scanPreviewWrap?.classList.add('hidden');
  scanBatchWrap?.classList.remove('hidden');

  const countBadge = $('#batch-count-badge');
  const countTitle = $('#batch-count-title');
  const pairCheckbox = $('#batch-pair-checkbox');

  if (countBadge) countBadge.textContent = `${files.length} seleccionadas`;
  if (countTitle) countTitle.textContent = `Lote de ${files.length} Fotografías`;

  const updateBatchLabel = () => {
    if (!btnStartBatch) return;
    const isPaired = pairCheckbox?.checked || false;
    const cardsCount = isPaired ? Math.ceil(files.length / 2) : files.length;
    btnStartBatch.innerHTML = isPaired 
      ? `🚀 Procesar Lote (${cardsCount} Tarjetas de 2 Caras)`
      : `🚀 Procesar Lote (${cardsCount} Tarjetas)`;
  };

  if (pairCheckbox) {
    pairCheckbox.onchange = updateBatchLabel;
  }
  updateBatchLabel();

  btnStartScan?.classList.add('hidden');
  if (btnStartBatch) {
    btnStartBatch.classList.remove('hidden');
    btnStartBatch.disabled = false;
  }

  const thumbsGrid = $('#batch-thumbnails-grid');
  if (thumbsGrid) {
    thumbsGrid.innerHTML = '';
    for (let i = 0; i < Math.min(files.length, 60); i++) {
      const thumb = document.createElement('div');
      thumb.className = 'batch-thumb-item';
      thumb.id = `batch-thumb-${i}`;
      const img = document.createElement('img');
      img.src = URL.createObjectURL(files[i]);
      thumb.appendChild(img);
      thumbsGrid.appendChild(thumb);
    }
  }
}

if (btnOpenScan && dialogScan) {
  btnOpenScan.addEventListener('click', () => {
    resetScanModal();
    dialogScan.showModal();
  });
}

function compressImageFile(file, maxDim = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const raw = e.target.result;
      const img = new Image();
      img.onload = () => {
        let width = img.width, height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
          else { width = Math.round((width * maxDim) / height); height = maxDim; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(raw);
      img.src = raw;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Carga de reverso en modo individual
if (scanBackFileInput) {
  scanBackFileInput.addEventListener('change', async (e) => {
    if (e.target.files?.length) {
      const file = e.target.files[0];
      const opt = await compressImageFile(file, 1600, 0.85);
      state.directorio.currentBackScanBase64 = opt;
      if (scanBackPreviewImg) {
        scanBackPreviewImg.src = opt;
        scanBackPreviewImg.classList.remove('hidden');
      }
      if (scanBackPlaceholder) scanBackPlaceholder.classList.add('hidden');
      if (scanRemoveBackImg) scanRemoveBackImg.classList.remove('hidden');
    }
  });
}

if (scanRemoveBackImg) {
  scanRemoveBackImg.addEventListener('click', () => {
    state.directorio.currentBackScanBase64 = '';
    if (scanBackPreviewImg) {
      scanBackPreviewImg.src = '';
      scanBackPreviewImg.classList.add('hidden');
    }
    if (scanBackPlaceholder) scanBackPlaceholder.classList.remove('hidden');
    if (scanRemoveBackImg) scanRemoveBackImg.classList.add('hidden');
    if (scanBackFileInput) scanBackFileInput.value = '';
  });
}

async function handleSelectedFiles(filesList) {
  const files = Array.from(filesList).filter(f => f.type.startsWith('image/'));
  if (!files.length) {
    toast('Por favor selecciona al menos una imagen válida', true);
    return;
  }

  const switchWrap = $('#scan-two-cards-switch-wrap');

  if (files.length === 1) {
    // 1 sola imagen: se coloca en Frente, slot de Reverso disponible
    const file = files[0];
    const opt = await compressImageFile(file, 1600, 0.85);
    state.directorio.currentScanBase64 = opt;
    state.directorio.currentBackScanBase64 = '';
    state.directorio.batchFiles = [file];

    if (scanPreviewImg) scanPreviewImg.src = opt;
    if (scanBackPreviewImg) {
      scanBackPreviewImg.src = '';
      scanBackPreviewImg.classList.add('hidden');
    }
    if (scanBackPlaceholder) scanBackPlaceholder.classList.remove('hidden');
    if (scanRemoveBackImg) scanRemoveBackImg.classList.add('hidden');
    if (switchWrap) switchWrap.classList.add('hidden');

    $('.scan-dropzone-inner')?.classList.add('hidden');
    if (scanBatchWrap) scanBatchWrap.classList.add('hidden');
    scanPreviewWrap?.classList.remove('hidden');

    if (btnStartScan) {
      btnStartScan.classList.remove('hidden');
      btnStartScan.disabled = false;
      btnStartScan.innerHTML = '⚡ Extraer Datos con IA';
    }
    if (btnStartBatch) btnStartBatch.classList.add('hidden');

  } else if (files.length === 2) {
    // EXACTAMENTE 2 IMÁGENES: Por defecto es FRENTE + REVERSO de la misma tarjeta!
    const optFront = await compressImageFile(files[0], 1600, 0.85);
    const optBack = await compressImageFile(files[1], 1600, 0.85);

    state.directorio.currentScanBase64 = optFront;
    state.directorio.currentBackScanBase64 = optBack;
    state.directorio.batchFiles = files;

    if (scanPreviewImg) scanPreviewImg.src = optFront;
    if (scanBackPreviewImg) {
      scanBackPreviewImg.src = optBack;
      scanBackPreviewImg.classList.remove('hidden');
    }
    if (scanBackPlaceholder) scanBackPlaceholder.classList.add('hidden');
    if (scanRemoveBackImg) scanRemoveBackImg.classList.remove('hidden');
    if (switchWrap) switchWrap.classList.remove('hidden');

    $('.scan-dropzone-inner')?.classList.add('hidden');
    if (scanBatchWrap) scanBatchWrap.classList.add('hidden');
    scanPreviewWrap?.classList.remove('hidden');

    if (btnStartScan) {
      btnStartScan.classList.remove('hidden');
      btnStartScan.disabled = false;
      btnStartScan.innerHTML = '⚡ Extraer Datos con IA (Frente + Reverso)';
    }
    if (btnStartBatch) btnStartBatch.classList.add('hidden');

    toast('Detectadas 2 fotos: asignadas automáticamente a Frente y Reverso.');
  } else {
    // 3 o más imágenes: Lote masivo
    if (switchWrap) switchWrap.classList.add('hidden');
    switchToBatchMode(files);
  }
}

if (scanFileInput) {
  scanFileInput.addEventListener('change', (e) => {
    if (e.target.files?.length) handleSelectedFiles(e.target.files);
  });
}
if (scanCameraInput) {
  scanCameraInput.addEventListener('change', (e) => {
    if (e.target.files?.length) handleSelectedFiles(e.target.files);
  });
}
if (scanRemoveImg) {
  scanRemoveImg.addEventListener('click', resetScanModal);
}
if (btnCancelBatch) {
  btnCancelBatch.addEventListener('click', resetScanModal);
}

// Drag & Drop
if (scanDropzone) {
  ['dragenter', 'dragover'].forEach(eventName => {
    scanDropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      scanDropzone.classList.add('dragover');
    }, false);
  });
  ['dragleave', 'drop'].forEach(eventName => {
    scanDropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      scanDropzone.classList.remove('dragover');
    }, false);
  });
  scanDropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt?.files?.length) handleSelectedFiles(dt.files);
  });
}

// PROCESAMIENTO INDIVIDUAL (Frente + Reverso opcional)
if (btnStartScan) {
  btnStartScan.addEventListener('click', async () => {
    if (!state.directorio.currentScanBase64) return;

    btnStartScan.disabled = true;
    btnStartScan.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></div> Procesando tarjeta...';
    scanAlert?.classList.remove('hidden');

    try {
      const response = await api('/api/directorio/scan-card', {
        method: 'POST',
        body: JSON.stringify({
          image_base64: state.directorio.currentScanBase64,
          back_image_base64: state.directorio.currentBackScanBase64 || ''
        })
      });

      const extracted = response.extracted || {};
      dialogScan.close();

      // Abrir modal de contacto con los datos extraídos y fotos vinculadas
      $('#contact-id').value = '';
      $('#contact-dialog-title').textContent = extracted.nombre_completo ? 'Confirmar Contacto Escaneado' : 'Nuevo Contacto';
      $('#btn-delete-contact-from-modal')?.classList.add('hidden');
      $('#contact-nombre').value = extracted.nombre_completo || '';
      $('#contact-puesto').value = extracted.puesto || '';
      $('#contact-empresa-nombre').value = extracted.empresa || '';
      $('#contact-correo').value = extracted.correo || '';
      $('#contact-web').value = extracted.sitio_web || '';
      $('#contact-tel1').value = extracted.telefono || '';
      $('#contact-tel2').value = extracted.telefono_2 || '';
      $('#contact-ubicacion-texto').value = extracted.direccion || '';
      setContactUbiType('Nacional');
      $('#contact-direccion').value = extracted.direccion || '';
      $('#contact-notas').value = extracted.notas || '';
      state.directorio.currentCardPhotoToSave = state.directorio.currentScanBase64;
      state.directorio.currentBackCardPhotoToSave = state.directorio.currentBackScanBase64 || '';

      $('#dialog-contacto').showModal();
      if (response.ok && extracted.nombre_completo) {
        toast('¡Tarjeta digitalizada con éxito! Revisa y guarda el contacto.');
      } else {
        toast('Tarjeta cargada. Completa los datos para registrar el contacto.');
      }
    } catch (err) {
      console.warn('Flujo asistido:', err);
      dialogScan.close();
      $('#contact-id').value = '';
      $('#contact-dialog-title').textContent = 'Nuevo Contacto';
      setContactUbiType('Nacional');
      state.directorio.currentCardPhotoToSave = state.directorio.currentScanBase64;
      state.directorio.currentBackCardPhotoToSave = state.directorio.currentBackScanBase64 || '';
      $('#dialog-contacto').showModal();
      toast('Tarjeta lista. Completa los datos para registrar el contacto.');
    } finally {
      btnStartScan.disabled = false;
      btnStartScan.innerHTML = '⚡ Extraer Datos con IA';
      scanAlert?.classList.add('hidden');
    }
  });
}

// PROCESAMIENTO MASIVO POR LOTES (Individual o Pares Frente+Reverso)
if (btnStartBatch) {
  btnStartBatch.addEventListener('click', async () => {
    const files = state.directorio.batchFiles || [];
    if (!files.length) return;

    const isPaired = $('#batch-pair-checkbox')?.checked || false;
    btnStartBatch.disabled = true;
    btnCancelBatch?.classList.add('hidden');
    const progBox = $('#batch-progress-box');
    progBox?.classList.remove('hidden');
    const progFill = $('#batch-progress-bar-fill');
    const progStatus = $('#batch-status-text');

    let processedCount = 0;
    const totalFiles = files.length;
    const step = isPaired ? 2 : 1;
    const totalCards = isPaired ? Math.ceil(totalFiles / 2) : totalFiles;

    for (let i = 0; i < totalFiles; i += step) {
      const cardIndex = isPaired ? Math.floor(i / 2) + 1 : i + 1;
      const frontFile = files[i];
      const backFile = isPaired && (i + 1 < totalFiles) ? files[i + 1] : null;

      const thumbFront = $(`#batch-thumb-${i}`);
      const thumbBack = backFile ? $(`#batch-thumb-${i + 1}`) : null;
      if (thumbFront) thumbFront.classList.add('processing');
      if (thumbBack) thumbBack.classList.add('processing');

      const pct = Math.round((cardIndex / totalCards) * 100);
      if (progFill) progFill.style.width = `${pct}%`;
      if (progStatus) {
        progStatus.textContent = backFile 
          ? `Analizando tarjeta ${cardIndex} de ${totalCards} (Frente + Reverso)...`
          : `Analizando tarjeta ${cardIndex} de ${totalCards}: ${frontFile.name}...`;
      }

      try {
        const frontOpt = await compressImageFile(frontFile, 1200, 0.80);
        let backOpt = '';
        if (backFile) {
          backOpt = await compressImageFile(backFile, 1200, 0.80);
        }

        let extracted = {};
        try {
          const resp = await api('/api/directorio/scan-card', {
            method: 'POST',
            body: JSON.stringify({
              image_base64: frontOpt,
              back_image_base64: backOpt
            })
          });
          if (resp && resp.ok && resp.extracted) {
            extracted = resp.extracted;
          }
        } catch (apiErr) {
          console.warn(`Extracción en lote omitida para tarjeta ${cardIndex}:`, apiErr);
        }

        const fallbackName = frontFile.name.replace(/.[^/.]+$/, '').replace(/[-_]/g, ' ') || `Contacto Tarjeta ${cardIndex}`;
        const contactPayload = {
          nombre_completo: extracted.nombre_completo || fallbackName,
          puesto: extracted.puesto || '',
          empresa_nombre: extracted.empresa || '',
          correo: extracted.correo || '',
          sitio_web: extracted.sitio_web || '',
          telefono: extracted.telefono || '',
          telefono_2: extracted.telefono_2 || '',
          ubicacion_texto: extracted.direccion || '',
          ubicacion_tipo: 'Nacional',
          direccion: extracted.direccion || '',
          notas: (extracted.notas ? extracted.notas + ' | ' : '') + (backFile ? 'Digitalizado en lote (Frente y Reverso)' : 'Digitalizado en lote'),
          foto_tarjeta: frontOpt,
          foto_tarjeta_reverso: backOpt
        };

        await api('/api/directorio/contactos', {
          method: 'POST',
          body: JSON.stringify(contactPayload)
        });

        if (thumbFront) {
          thumbFront.classList.remove('processing');
          thumbFront.classList.add('processed');
        }
        if (thumbBack) {
          thumbBack.classList.remove('processing');
          thumbBack.classList.add('processed');
        }
        processedCount++;
      } catch (err) {
        console.error(`Error al procesar tarjeta ${cardIndex}:`, err);
      }

      // Pausa controlada de 1.8 segundos entre tarjetas para respetar la cuota gratuita de Google (15 RPM)
      if (i + step < totalFiles) {
        await new Promise(res => setTimeout(res, 1800));
      }
    }

    toast(`¡Lote finalizado! Se digitalizaron y guardaron ${processedCount} tarjetas con sus fotos.`);
    dialogScan.close();
    await renderDirectorio();
  });
}

const btnSwitchToBatch = $('#btn-switch-to-batch');
if (btnSwitchToBatch) {
  btnSwitchToBatch.addEventListener('click', () => {
    if (state.directorio.batchFiles?.length) {
      switchToBatchMode(state.directorio.batchFiles);
    }
  });
}

const btnDeleteFromModal = $('#btn-delete-contact-from-modal');
if (btnDeleteFromModal) {
  btnDeleteFromModal.addEventListener('click', async () => {
    const id = Number($('#contact-id').value);
    if (!id) return;
    $('#dialog-contacto').close();
    await confirmDeleteContact(id);
  });
}


const btnUnifyCats = $('#btn-unify-catalogs');
if (btnUnifyCats) {
  btnUnifyCats.addEventListener('click', async () => {
    btnUnifyCats.disabled = true;
    btnUnifyCats.textContent = 'Unificando catálogos...';
    try {
      const res = await api('/api/directorio/unificar-catalogos', { method: 'POST' });
      const msg = (res.unified_companies > 0 || res.unified_contacts > 0)
        ? `¡Listo! Se unificaron ${res.unified_companies} denominaciones duplicadas y ${res.unified_contacts} contactos.`
        : 'Todos los catálogos y contactos ya están unificados.';
      toast(msg);
      await renderDirectorio();
    } catch (err) {
      toast(err.message, true);
    } finally {
      btnUnifyCats.disabled = false;
      btnUnifyCats.textContent = '🔄 Unificar y Normalizar Catálogos Ahora';
    }
  });
}

function openViewContactDossier(id) {
  const c = state.directorio.contacts.find(x => x.id_contacto === id);
  if (!c) return;

  const dialog = $('#dialog-contacto-vista');
  if (!dialog) return;

  const headerTitle = $('#view-contact-header-title');
  if (headerTitle) headerTitle.textContent = `Ficha: ${c.nombre_completo || 'Contacto'}`;

  const fullNameEl = $('#view-contact-fullname');
  if (fullNameEl) fullNameEl.textContent = c.nombre_completo || 'Sin nombre';

  const puestoEl = $('#view-contact-puesto');
  if (puestoEl) puestoEl.textContent = c.puesto || 'Puesto no asignado';

  // Logo / Avatar
  const logoUrl = getCompanyLogoUrl(c);
  const initials = (c.nombre_completo || 'C').split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const avatarWrap = $('#view-contact-avatar-wrap');
  if (avatarWrap) {
    avatarWrap.innerHTML = logoUrl
      ? `<div class="contact-avatar has-logo" style="width:58px; height:58px; border-radius:14px;">
           <img src="${logoUrl}" alt="Logo" class="contact-logo-img" onerror="this.parentElement.classList.add('avatar-text'); this.parentElement.innerHTML='${esc(initials)}';">
         </div>`
      : `<div class="contact-avatar avatar-text" style="width:58px; height:58px; border-radius:14px; font-size:18px;">${esc(initials)}</div>`;
  }

  // Badges
  const badgesWrap = $('#view-contact-badges');
  if (badgesWrap) {
    badgesWrap.innerHTML = `
      ${c.empresa_display ? `<span class="badge-empresa">🏢 ${esc(c.empresa_display)}</span>` : ''}
      ${c.ubicacion_tipo ? `<span class="badge-ubi ${c.ubicacion_tipo.toLowerCase()}">${c.ubicacion_tipo === "Nacional" ? "🇲🇽 Nacional" : "🌐 Internacional"}</span>` : ''}
      ${c.ubicacion_display ? `<span class="badge-ubi">📍 ${esc(c.ubicacion_display)}</span>` : ''}
    `;
  }

  // Teléfonos
  const waNumber = cleanPhoneForWa(c.telefono || c.telefono_2);
  const telClean = (c.telefono || c.telefono_2 || '').replace(/[^0-9+]/g, '');
  const tel1Box = $('#view-contact-tel1');
  if (tel1Box) {
    tel1Box.innerHTML = c.telefono
      ? `<a href="tel:${telClean}" style="color:var(--text); font-weight:700;">${esc(c.telefono)}</a>
         ${waNumber ? `<a href="https://wa.me/${waNumber}" target="_blank" rel="noopener" class="button ghost" style="padding:2px 8px; font-size:11px; margin-left:6px;">💬 WhatsApp</a>` : ''}`
      : '<span style="color:var(--muted); font-weight:normal;">No registrado</span>';
  }

  const tel2Box = $('#view-contact-tel2');
  if (tel2Box) {
    tel2Box.innerHTML = c.telefono_2
      ? `<a href="tel:${(c.telefono_2 || '').replace(/[^0-9+]/g, '')}" style="color:var(--text);">${esc(c.telefono_2)}</a>`
      : '<span style="color:var(--muted);">No registrado</span>';
  }

  // Correo
  const correoBox = $('#view-contact-correo');
  if (correoBox) {
    correoBox.innerHTML = c.correo
      ? `<a href="mailto:${esc(c.correo)}">${esc(c.correo)}</a>`
      : '<span style="color:var(--muted);">No registrado</span>';
  }

  // Web
  const webBox = $('#view-contact-web');
  if (webBox) {
    webBox.innerHTML = c.sitio_web
      ? `<a href="${esc(formatWebUrl(c.sitio_web))}" target="_blank" rel="noopener">${esc(c.sitio_web.replace(/^https?:\/\//i, ''))}</a>`
      : '<span style="color:var(--muted);">No registrado</span>';
  }

  // Dirección y Ubicación
  const dirBox = $('#view-contact-direccion');
  if (dirBox) {
    const fullDir = [c.direccion, c.ubicacion_display || c.ubicacion_texto].filter(Boolean).join(' • ');
    dirBox.textContent = fullDir || 'No registrada';
  }

  // Notas
  const notasWrap = $('#view-contact-notas-wrap');
  const notasBox = $('#view-contact-notas');
  if (c.notas && c.notas.trim()) {
    if (notasWrap) notasWrap.classList.remove('hidden');
    if (notasBox) notasBox.textContent = c.notas;
  } else {
    if (notasWrap) notasWrap.classList.add('hidden');
  }

  // Fotos de la tarjeta
  const photosSec = $('#view-contact-photos-section');
  const photosGrid = $('#view-contact-photos-grid');
  if (c.foto_tarjeta || c.foto_tarjeta_reverso) {
    if (photosSec) photosSec.classList.remove('hidden');
    if (photosGrid) {
      photosGrid.innerHTML = `
        ${c.foto_tarjeta ? `
          <div class="dossier-photo-thumb" style="text-align:center; cursor:pointer;" onclick="openCardPhotoViewer('${esc(c.nombre_completo)}', '${esc(c.foto_tarjeta)}', '${esc(c.foto_tarjeta_reverso || '')}')" title="Clic para ampliar foto frontal">
            <span style="font-size:11px; font-weight:700; color:var(--muted); display:block; margin-bottom:4px;">🖼️ Frente</span>
            <img src="${c.foto_tarjeta}" alt="Frente" style="max-width:100%; max-height:140px; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.15);">
          </div>
        ` : ''}
        ${c.foto_tarjeta_reverso ? `
          <div class="dossier-photo-thumb" style="text-align:center; cursor:pointer;" onclick="openCardPhotoViewer('${esc(c.nombre_completo)}', '${esc(c.foto_tarjeta || '')}', '${esc(c.foto_tarjeta_reverso)}')" title="Clic para ampliar foto trasera">
            <span style="font-size:11px; font-weight:700; color:var(--muted); display:block; margin-bottom:4px;">🔄 Reverso</span>
            <img src="${c.foto_tarjeta_reverso}" alt="Reverso" style="max-width:100%; max-height:140px; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.15);">
          </div>
        ` : ''}
      `;
    }
  } else {
    if (photosSec) photosSec.classList.add('hidden');
  }

  // Conectar botón para editar
  const btnEdit = $('#btn-view-to-edit');
  if (btnEdit) {
    btnEdit.onclick = () => {
      dialog.close();
      openEditContact(c.id_contacto);
    };
  }

  // Conectar botón vCard
  const vcardLink = $('#btn-view-vcard');
  if (vcardLink) {
    vcardLink.href = `/api/directorio/vcard/${c.id_contacto}`;
  }

  dialog.showModal();
}
