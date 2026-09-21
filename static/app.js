const state={me:null,system:null,view:'dashboard',quote:null,language:'en',importToken:null,bootstrap:false,users:[]};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=(v='')=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

const I18N={
  en:{sales_followup:'Sales follow-up',dashboard:'Dashboard',priorities:'SABC Priorities',managed:'Managed',safe:'Safe',po_missing:'PO Date Missing',lost:'Lost',archive:'Archive',historical:'Historical',reports:'Reports',users:'Users',quotation_management:'QUOTATION MANAGEMENT',agent:'NT Tool agent',language:'Language',upload_excel:'Upload Excel',logout:'Log out',change_password:'Change password',current_password:'Current password',new_password:'New password',pending_total:'Pending quotation total',in_followup:'IN FOLLOW-UP',priority_distribution:'Priority distribution',daily_report:'DAILY REPORT',today_activity:"Today's activity",generate_daily:'Generate daily report',attention:'ATTENTION',priority_quotes:'Priority quotations',view_all:'View all',search:'Search',priority:'Priority',sort_by:'Sort by',period_activity:'Quotation activity by period',report_help:'The report counts newly imported quotations, saved Manage reviews, status changes, losses, and PO conversions for the selected period.',daily:'Daily',weekly:'Weekly',monthly:'Monthly',custom:'Custom range',start_date:'Start date',end_date:'End date',scope:'Scope',generate_report:'Generate report',user_admin:'USER ADMINISTRATION',create_user:'Create user',display_name:'Display name',role:'Role',temporary_password:'Temporary password',generate_password:'Generate temporary password',temporary_password_help:'Copy the password before saving. The user will be asked to replace it at the next login.',recent_audit:'Recent audit activity',select_workspace:'SELECT WORKSPACE',choose_system:'Choose a follow-up system',standard_help:'USD quotations imported from the daily Excel report.',special_help:'Special items in JPY with percentile-based priorities.',import_data:'IMPORT DATA',cancel:'Cancel',preview:'Preview',confirm_import:'Confirm import',update_followup:'UPDATE FOLLOW-UP',status:'Status',followup_method:'Follow-up method',loss_reason:'Loss reason',po_date:'PO date',mark_safe:'Mark as Safe',new_comment:'New comment',comment_history:'Comment history',save_review:'Save review',operation_details:'OPERATION DETAILS',audit_history:'Activity history',edit_user:'Edit user',active:'Active',reset_password:'Reset password',save:'Save',all_agents:'All agents',pending:'Pending',view:'View',manage:'Manage',restore:'Restore',added_today:'Added today',po_today:'PO today',overdue:'Overdue follow-ups',po_date_missing:'PO date missing',quotations:'quotations',quoted_total:'Quoted total',po_total:'PO total',grand_total:'Pending + PO total',backup_ok:'Backup verified',backup_due:'Backup overdue or missing',no_records:'No quotations match this view.',read_only:'Read-only historical data',import_complete:'Import completed',all_team:'All team',my_activity:'My activity',new:'New',updated:'Updated',unchanged:'Unchanged',duplicates:'Duplicates',invalid:'Invalid',excluded:'Archived / hidden',rows:'Rows',details:'Details',end_user:'End User',company:'Distributor',net_total:'Net internal total',order:'Customer order',method:'Method',last_review:'Last review',days:'days',rank:'Rank',model:'Model',quantity:'Quantity',unit_price:'Unit price',reason:'Loss reason',date:'Date',reference:'Quotation',nt_agent:'NT Tool agent',dist_agent:'Distributor agent',no_comments:'No comments have been saved.',no_activity:'No activity has been recorded.',reviewed:'Reviewed',status_changes:'Status changes',converted_po:'Converted to PO',lost_quotes:'Lost quotations',financial_summary:'Financial summary',loss_breakdown:'Loss reasons',po_comparison:'QT versus PO',signin:'Sign in',initial_setup:'Initial setup: choose takujiyamada or ignacioillescas and create the first password.',password:'Password',username:'Username',po_invoices:'PO invoices',po_invoices_help:'Add every invoice that forms this PO. The total and PO date are calculated automatically.',add_invoice:'+ Add invoice',invoice_date:'Invoice date',invoice_series:'Series / folio',invoice_number:'Invoice number / code',invoice_amount:'Invoice amount',remove:'Remove',invoices:'Invoices',hide_navigation:'Hide navigation',show_navigation:'Show navigation',management:'Management',period:'Period',all_history:'All history',today:'Today',current_month:'Current month',fiscal_year:'Fiscal year',all:'All',distributor_code:'Distributor code',quote_age:'Days open',last_activity:'Last activity',initial_import:'Initial import',stale_question:'This quotation is more than 90 days old. Was it lost?',color_legend:'Row colors',no_code:'No code',upload_invoices:'Upload invoices',invoice_import_help:'Invoices are matched through Texto Extra 2 only to quotations in PO Date Missing.'},
  es:{sales_followup:'Seguimiento de ventas',dashboard:'Resumen',priorities:'Prioridades SABC',managed:'Gestionadas',safe:'Seguras',po_missing:'PO sin fecha',lost:'Perdidas',archive:'Archivo',historical:'Históricas',reports:'Reportes',users:'Usuarios',quotation_management:'GESTIÓN DE COTIZACIONES',agent:'Agente NT Tool',language:'Idioma',upload_excel:'Subir Excel',logout:'Cerrar sesión',change_password:'Cambiar contraseña',current_password:'Contraseña actual',new_password:'Nueva contraseña',pending_total:'Total de cotizaciones pendientes',in_followup:'EN SEGUIMIENTO',priority_distribution:'Distribución por prioridad',daily_report:'REPORTE DIARIO',today_activity:'Actividad de hoy',generate_daily:'Generar reporte diario',attention:'ATENCIÓN',priority_quotes:'Cotizaciones prioritarias',view_all:'Ver todas',search:'Buscar',priority:'Prioridad',sort_by:'Ordenar por',period_activity:'Actividad de cotizaciones por periodo',report_help:'El reporte cuenta cotizaciones nuevas importadas, revisiones guardadas en Manage, cambios de estado, pérdidas y conversiones a PO del periodo seleccionado.',daily:'Diario',weekly:'Semanal',monthly:'Mensual',custom:'Rango personalizado',start_date:'Fecha inicial',end_date:'Fecha final',scope:'Alcance',generate_report:'Generar reporte',user_admin:'ADMINISTRACIÓN DE USUARIOS',create_user:'Crear usuario',display_name:'Nombre visible',role:'Rol',temporary_password:'Contraseña temporal',generate_password:'Generar contraseña temporal',temporary_password_help:'Copia la contraseña antes de guardar. El usuario deberá reemplazarla al iniciar sesión.',recent_audit:'Actividad reciente de auditoría',select_workspace:'SELECCIONAR ESPACIO',choose_system:'Elige un sistema de seguimiento',standard_help:'Cotizaciones en USD importadas desde el Excel diario.',special_help:'Artículos especiales en JPY con prioridades por percentiles.',import_data:'IMPORTAR DATOS',cancel:'Cancelar',preview:'Vista previa',confirm_import:'Confirmar importación',update_followup:'ACTUALIZAR SEGUIMIENTO',status:'Estado',followup_method:'Método de seguimiento',loss_reason:'Motivo de pérdida',po_date:'Fecha de PO',mark_safe:'Marcar como segura',new_comment:'Nuevo comentario',comment_history:'Historial de comentarios',save_review:'Guardar revisión',operation_details:'DETALLES DE LA OPERACIÓN',audit_history:'Historial de actividad',edit_user:'Editar usuario',active:'Activo',reset_password:'Restablecer contraseña',save:'Guardar',all_agents:'Todos los agentes',pending:'Pendiente',view:'Ver',manage:'Gestionar',restore:'Restaurar',added_today:'Agregadas hoy',po_today:'PO de hoy',overdue:'Seguimientos vencidos',po_date_missing:'PO sin fecha',quotations:'cotizaciones',quoted_total:'Total cotizado',po_total:'Total de PO',grand_total:'Total pendiente + PO',backup_ok:'Respaldo verificado',backup_due:'Respaldo vencido o inexistente',no_records:'No hay cotizaciones en esta vista.',read_only:'Datos históricos de solo lectura',import_complete:'Importación completada',all_team:'Todo el equipo',my_activity:'Mi actividad',new:'Nuevas',updated:'Actualizadas',unchanged:'Sin cambios',duplicates:'Duplicadas',invalid:'Inválidas',excluded:'Archivadas / ocultas',rows:'Filas',details:'Detalles',end_user:'Usuario final',company:'Distribuidor',net_total:'Total neto interno',order:'Orden del cliente',method:'Método',last_review:'Última revisión',days:'días',rank:'Rango',model:'Modelo',quantity:'Cantidad',unit_price:'Precio unitario',reason:'Motivo de pérdida',date:'Fecha',reference:'Cotización',nt_agent:'Agente NT Tool',dist_agent:'Agente distribuidor',no_comments:'No se han guardado comentarios.',no_activity:'No se ha registrado actividad.',reviewed:'Revisadas',status_changes:'Cambios de estado',converted_po:'Convertidas a PO',lost_quotes:'Cotizaciones perdidas',financial_summary:'Resumen financiero',loss_breakdown:'Motivos de pérdida',po_comparison:'Comparación QT contra PO',signin:'Entrar',initial_setup:'Configuración inicial: selecciona takujiyamada o ignacioillescas y crea la primera contraseña.',password:'Contraseña',username:'Usuario',po_invoices:'Facturas de la PO',po_invoices_help:'Agrega todas las facturas que componen esta PO. El total y la fecha de PO se calculan automáticamente.',add_invoice:'+ Agregar factura',invoice_date:'Fecha de factura',invoice_series:'Serie / folio',invoice_number:'Número / código de factura',invoice_amount:'Importe de factura',remove:'Eliminar',invoices:'Facturas',hide_navigation:'Ocultar navegación',show_navigation:'Mostrar navegación',management:'Gerencia',period:'Periodo',all_history:'Todo el historial',today:'Hoy',current_month:'Mes actual',fiscal_year:'Año fiscal',all:'Todos',distributor_code:'Código distribuidor',quote_age:'Días abierta',last_activity:'Última actividad',initial_import:'Alta inicial',stale_question:'Esta cotización tiene más de 90 días. ¿Se perdió?',color_legend:'Colores de seguimiento',no_code:'Sin código',upload_invoices:'Subir facturas',invoice_import_help:'Las facturas se relacionan mediante Texto Extra 2 únicamente con cotizaciones de PO sin fecha.'},
  ja: {sales_followup:'営業フォローアップ',dashboard:'ダッシュボード',priorities:'優先度 SABC',managed:'対応済み',safe:'安全 (Safe)',po_missing:'PO 日付なし',lost:'失注 (Lost)',archive:'アーカイブ',historical:'履歴データ',reports:'レポート',users:'ユーザー',quotation_management:'見積管理',agent:'NT担当者',language:'言語',upload_excel:'Excelアップロード',logout:'ログアウト',change_password:'パスワード変更',current_password:'現在のパスワード',new_password:'新しいパスワード',pending_total:'保留中の見積合計',in_followup:'フォローアップ中',priority_distribution:'優先度分布',daily_report:'日報',today_activity:'今日の活動',generate_daily:'日報を作成',attention:'要注意',priority_quotes:'優先見積',view_all:'すべて表示',search:'検索',priority:'優先度',sort_by:'並べ替え',period_activity:'期間別の見積活動',report_help:'選択した期間の新規見積、保存されたレビュー、ステータス変更、失注、PO変換をカウントします。',daily:'日次',weekly:'週次',monthly:'月次',custom:'カスタム範囲',start_date:'開始日',end_date:'終了日',scope:'範囲',generate_report:'レポート作成',user_admin:'ユーザー管理',create_user:'ユーザー作成',display_name:'表示名',role:'役割',temporary_password:'一時パスワード',generate_password:'一時パスワード生成',temporary_password_help:'保存する前にパスワードをコピーしてください。',recent_audit:'最近の監査活動',select_workspace:'ワークスペース選択',choose_system:'システムを選択',standard_help:'日次ExcelからインポートされたUSD見積。',special_help:'パーセンタイルベースの優先度を持つJPYの特別アイテム。',import_data:'データインポート',cancel:'キャンセル',preview:'プレビュー',confirm_import:'インポート確認',update_followup:'フォローアップ更新',status:'ステータス',followup_method:'フォローアップ方法',loss_reason:'失注理由',po_date:'PO日付',mark_safe:'安全(Safe)にマーク',new_comment:'新規コメント',comment_history:'コメント履歴',save_review:'レビューを保存',operation_details:'操作詳細',audit_history:'活動履歴',edit_user:'ユーザー編集',active:'有効',reset_password:'パスワードリセット',save:'保存',all_agents:'すべての担当者',pending:'保留中',view:'表示',manage:'管理',restore:'復元',added_today:'本日追加',po_today:'本日のPO',overdue:'期限切れのフォローアップ',po_date_missing:'PO日付なし',quotations:'件',quoted_total:'見積合計',po_total:'PO合計',grand_total:'保留中 + PO合計',backup_ok:'バックアップ確認済み',backup_due:'バックアップ期限切れ',no_records:'データがありません。',read_only:'読み取り専用の履歴データ',import_complete:'インポート完了',all_team:'全チーム',my_activity:'自分の活動',new:'新規',updated:'更新済み',unchanged:'変更なし',duplicates:'重複',invalid:'無効',excluded:'除外 / 非表示',rows:'行',details:'詳細',end_user:'エンドユーザー',company:'代理店',net_total:'社内純合計',order:'顧客注文',method:'方法',last_review:'最終レビュー',days:'日',rank:'ランク',model:'モデル',quantity:'数量',unit_price:'単価',reason:'失注理由',date:'日付',reference:'見積番号',nt_agent:'NT担当者',dist_agent:'代理店担当者',no_comments:'コメントはありません。',no_activity:'活動記録はありません。',reviewed:'レビュー済み',status_changes:'ステータス変更',converted_po:'PO変換',lost_quotes:'失注見積',financial_summary:'財務概要',loss_breakdown:'失注理由の内訳',po_comparison:'見積 vs PO',signin:'サインイン',initial_setup:'初期設定',password:'パスワード',username:'ユーザー名',po_invoices:'POの請求書',po_invoices_help:'このPOの請求書を追加します。合計と日付は自動計算されます。',add_invoice:'+ 請求書追加',invoice_date:'請求日',invoice_series:'シリーズ / フォリオ',invoice_number:'請求書番号 / コード',invoice_amount:'請求額',remove:'削除',invoices:'請求書',hide_navigation:'ナビゲーション非表示',show_navigation:'ナビゲーション表示',management:'管理 (Management)',period:'期間',all_history:'全履歴',today:'今日',current_month:'今月',fiscal_year:'会計年度',all:'すべて',distributor_code:'代理店コード',quote_age:'経過日数',last_activity:'最終活動',initial_import:'初回インポート',stale_question:'この見積は90日以上経過しています。失注しましたか？',color_legend:'行の色の凡例',no_code:'コードなし'}
};
const t=k=>I18N[state.language]?.[k]||I18N.en[k]||k;
const currency=()=>state.system==='special'?'JPY':'USD';
const money=v=>new Intl.NumberFormat(state.language==='es'?'es-MX':'en-US',{style:'currency',currency:currency(),maximumFractionDigits:currency()==='JPY'?0:2}).format(Number(v||0));
const fmtDate=v=>v?new Intl.DateTimeFormat(state.language==='es'?'es-MX':'en-US',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(`${v}T12:00:00`)):'—';
const fmtDT=v=>v?new Date(v).toLocaleString(state.language==='es'?'es-MX':'en-US'):'—';
const prefix=()=>state.system==='special'?'/api/special':'/api';
const isoLocal=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

function dashboardRange(){
  const kind=$('#dashboard-period').value;
  const today=new Date();
  let start='';let end='';
  if(kind==='today')start=end=isoLocal(today);
  if(kind==='month'){start=isoLocal(new Date(today.getFullYear(),today.getMonth(),1));end=isoLocal(today);}
  if(kind==='fiscal'){
    const fiscalYear=today.getMonth()<3?today.getFullYear()-1:today.getFullYear();
    start=isoLocal(new Date(fiscalYear,3,1));end=isoLocal(today);
  }
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
  if(!response.ok) throw new Error(body.error||'Request failed');
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
// --- NUEVA FUNCIÓN: Botón flotante para SecretAdmin ---
function setupSecretAdminToggle() {
    // Si no eres SecretAdmin, nos aseguramos de que no exista el botón
    if (state.me?.role?.toLowerCase() !== 'secretadmin') {
        if (document.getElementById('secretadmin-view-toggle')) {
            document.getElementById('secretadmin-view-toggle').style.display = 'none';
        }
        return;
    }

    let toggleBtn = document.getElementById('secretadmin-view-toggle');
    if (!toggleBtn) {
        // Creamos el botón flotante
        toggleBtn = document.createElement('button');
        toggleBtn.id = 'secretadmin-view-toggle';
        toggleBtn.style.position = 'fixed';
        toggleBtn.style.bottom = '20px';
        toggleBtn.style.right = '20px';
        toggleBtn.style.zIndex = '9999';
        toggleBtn.style.padding = '12px 20px';
        toggleBtn.style.borderRadius = '30px';
        toggleBtn.style.border = 'none';
        toggleBtn.style.fontWeight = 'bold';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
        toggleBtn.style.transition = 'all 0.3s ease';
        document.body.appendChild(toggleBtn);
        
        // Lo que pasa cuando haces clic
        toggleBtn.addEventListener('click', async () => {
            // Cambiamos tu estado de forma local (sin tocar la BD)
            state.me.management_profile = !state.me.management_profile;
            updateToggleUI();
            
            // Ocultamos/Mostramos las pestañas de navegación al vuelo
            $$('.regular-nav').forEach(e => e.classList.toggle('hidden', !!state.me.management_profile));
            $$('.manager-only').forEach(e => e.classList.toggle('hidden', !state.me.management_profile));
            
            // Te mandamos a la pantalla correcta
            if (state.system) {
                await navigate(state.me.management_profile ? 'management' : 'dashboard');
            }
        });
    }
    
    // Función para cambiar los colores del botón dependiendo la vista
    function updateToggleUI() {
        toggleBtn.innerHTML = state.me.management_profile ? '👀 Vista: MANAGER' : '👀 Vista: DEVELOPER';
        toggleBtn.style.background = state.me.management_profile ? '#d97706' : '#2563eb'; // Naranja o Azul
        toggleBtn.style.color = '#fff';
    }
    
    updateToggleUI();
    toggleBtn.style.display = 'block';
}

// --- REEMPLAZO: Conectamos el botón al inicio de sesión ---
async function enterApp(user){
  state.me=user;
  state.language=$('#login-language').value||user.language||'en';
  applyLanguage();
  $('#user-name').textContent=user.display_name;
  $('#app').classList.remove('hidden');
  $('#login-dialog').close();
  $$('.admin-only').forEach(e=>e.classList.toggle('hidden',!user.can_admin_users));
  $$('.audit-only').forEach(e=>e.classList.toggle('hidden',!user.can_view_audit));
  $$('.regular-nav').forEach(e=>e.classList.toggle('hidden',!!user.management_profile));
  $$('.manager-only').forEach(e=>e.classList.toggle('hidden',!user.management_profile));
  $('#upload-button').classList.toggle('hidden',!user.can_edit);
  $$('.invoice-import-only').forEach(e=>e.classList.toggle('hidden',!user.can_edit));
  $('#report-scope').options[1].disabled=!user.can_team_reports;
  
  // Encendemos el botón de SecretAdmin
  setupSecretAdminToggle();
  
  $('#system-dialog').showModal();
  if(user.must_change_password){
      $('#password-notice').textContent=state.language==='es'?'Debes reemplazar la contraseña temporal antes de continuar.':'Replace the temporary password before continuing.';
      $('#password-dialog').showModal();
  }
}

// --- REEMPLAZO: Ajustamos selectSystem para que no pelee con tu botón ---
async function selectSystem(system){
  state.system=system;
  $('#system-dialog').close();
  $('#system-button').textContent=system==='special'?'Special Quotations (JPY)':'Follow Up Quotations (USD)';
  $$('.special-only').forEach(e=>e.classList.toggle('hidden',system!=='special'));
  $$('.standard-only').forEach(e=>e.classList.toggle('hidden',system==='special'));
  if(!state.me?.can_edit)$$('.invoice-import-only').forEach(e=>e.classList.add('hidden'));

  $$('.regular-nav').forEach(e=>e.classList.toggle('hidden',!!state.me?.management_profile));
  $$('.manager-only').forEach(e=>e.classList.toggle('hidden',!state.me?.management_profile));
  
  renderLegend();
  await Promise.all([loadAgents(),loadRanks()]);
  await navigate(state.me?.management_profile?'management':'dashboard');
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

  //LINEA NUEVA: Ocultar vistas no permitidas para el perfil directivo
  if(state.me?.management_profile)$$('.regular-nav').forEach(e=>e.classList.add('hidden'));
  renderLegend();
  await Promise.all([loadAgents(),loadRanks()]);
  await navigate(state.me?.management_profile?'management':'dashboard');
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
  if(state.me?.management_profile&&!['management','reports','users'].includes(view))view='management';
  state.view=view;
  $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  $$('.view').forEach(v=>v.classList.remove('active'));
  const titles={dashboard:t('dashboard'),management:t('management'),pending:t('priorities'),managed:t('managed'),safe:t('safe'),po_missing:t('po_missing'),po:'PO',lost:t('lost'),archive:t('archive'),historical:t('historical'),reports:t('reports'),users:t('users')};
  $('#page-title').textContent=titles[view]||view;
  await updateGlobalTotal();
  if(view==='dashboard'){$('#view-dashboard').classList.add('active');await renderDashboard();}
  else if(view==='reports'){$('#view-reports').classList.add('active');setPreset('daily');await renderReport();}
  else if(view==='users'){$('#view-users').classList.add('active');await renderUsers();}
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
  $('#priority-filter-wrap').classList.toggle('hidden',managed);
  $('#rank-filter-wrap').classList.toggle('hidden',managed||state.system!=='special');
  $('#order-filter-wrap').classList.toggle('hidden',managed);
  $('#management-summary').classList.toggle('hidden',!management);
  if(managed)$('#quote-order').value='newest_activity';
}
function listParams(){
  const managed=state.view==='managed';const management=state.view==='management';
  const p=new URLSearchParams({agent:$('#global-agent').value,search:$('#quote-search').value});
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
  return `<h3>${t('priority_distribution')}</h3><div class="priority-summary">${cards}</div><div class="pipeline-summary"><div><span>${t('pending_total')}</span><strong>${money(c.pending_value)}</strong></div><div><span>${t('po_total')}</span><strong>${money(c.po_value)}</strong></div><div class="grand"><span>${t('grand_total')}</span><strong>${money(Number(c.pending_value||0)+Number(c.po_value||0))}</strong></div></div>${trackingLegend()}`;
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
  let days = Number(q.quote_age_days || 0);
  
  // Si es PO, congelar con la fecha de la factura
  if (q.status === 'po' && q.po_date) {
    const d1 = new Date(`${q.quote_date.substring(0, 10)}T12:00:00`);
    const d2 = new Date(`${q.po_date.substring(0, 10)}T12:00:00`);
    days = Math.max(0, Math.floor((d2 - d1) / 86400000));
  } 
  // Si es Lost, congelar con la fecha en que se marcó como perdida
  else if (q.status === 'lost' && q.status_changed_at) {
    const d1 = new Date(`${q.quote_date.substring(0, 10)}T12:00:00`);
    const d2 = new Date(`${q.status_changed_at.substring(0, 10)}T12:00:00`);
    days = Math.max(0, Math.floor((d2 - d1) / 86400000));
  }
  
  return `<span class="age-badge${days > 90 ? ' stale' : ''}">${days > 90 ? '90+' : days} ${t('days')}</span>`;
}
function activityCell(q) {
  let detail = '';
  if (q.activity_is_initial) {
    detail = `<span class="initial-badge">${t('initial_import')}</span>`;
  } else if (q.follow_up_type) {
    detail = `<span class="initial-badge">FollowUp - ${methodLabel(q.follow_up_type)}</span>`;
  }
  
  // SOLUCIÓN: Recortar la hora y usar solo los primeros 10 caracteres (YYYY-MM-DD)
  const dateOnly = q.last_activity_at ? q.last_activity_at.substring(0, 10) : '';
  
  return `${fmtDate(dateOnly)}${detail}`;
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
function detailsHtml(raw){const q=normalizeQuote(raw);const pairs=state.system==='special'?[[t('reference'),q.folio||'—'],[t('date'),fmtDate(q.quote_date)],[t('end_user'),q.receptor||'—'],[t('rank'),q.rank||'—'],["Item code",q.code||'—'],[t('model'),q.description||'—'],[t('quantity'),q.quantity??'—'],[`${t('unit_price')} (JPY)`,money(q.unit_price)],[t('nt_agent'),q.nt_agent||'—'],[t('status'),statusLabel(q.status)]]:[[t('reference'),q.folio||'—'],[t('date'),fmtDate(q.quote_date)],["Series",q.series||'—'],[t('company'),q.distributor_company||'—'],[t('end_user'),q.end_user||'—'],[t('dist_agent'),q.distributor_agent||'—'],[t('nt_agent'),q.nt_agent||'—'],[`${t('quoted_total')} (USD)`,money(q.total_usd)],[t('net_total'),q.net_total_usd==null?'—':money(q.net_total_usd)],[t('order'),q.customer_order||'—'],[t('status'),statusLabel(q.status)]];if(q.status==='po')pairs.push([t('po_date'),fmtDate(q.po_date)],[t('po_total'),q.po_total_usd?money(q.po_total_usd):'—']);if(q.status==='lost')pairs.push([t('reason'),q.loss_reason||'—']);return pairs.map(([k,v])=>`<div><span>${esc(k)}</span><strong>${esc(v==null?'—':v)}</strong></div>`).join('');}
function commentsHtml(comments){return comments?.length?comments.map(c=>`<div class="history-item"><strong>${esc(c.user_name)}</strong><time>${fmtDT(c.created_at)}</time><p>${esc(c.body)}</p></div>`).join(''):`<p class="muted">${t('no_comments')}</p>`;}
function invoicesHtml(invoices){return `<table class="invoice-table"><thead><tr><th>${t('invoice_date')}</th><th>${t('invoice_series')}</th><th>${t('invoice_number')}</th><th>${t('invoice_amount')}</th></tr></thead><tbody>${invoices.map(row=>`<tr><td>${fmtDate(row.invoice_date)}</td><td>${esc(row.invoice_series)}</td><td class="folio">${esc(row.invoice_number)}</td><td class="money">${money(row.amount)}</td></tr>`).join('')}</tbody></table>`;}
async function openView(id){try{const q=normalizeQuote(await api(`${prefix()}/quotes/${id}`));state.quote=q;$('#view-title').textContent=q.folio;$('#view-details').innerHTML=detailsHtml(q);const showInvoices=q.status==='po'&&q.invoices.length;$('#view-invoices-section').classList.toggle('hidden',!showInvoices);$('#view-invoices').innerHTML=showInvoices?invoicesHtml(q.invoices):'';$('#view-comments').innerHTML=commentsHtml(q.comments);$('#view-events').innerHTML=q.events?.length?q.events.slice().reverse().map(e=>`<div class="history-item"><strong>${esc(eventLabel(e.event_type))}</strong><time>${esc(e.user_name||'System')} · ${fmtDT(e.created_at)}</time><p>${esc(e.note||'')}</p></div>`).join(''):`<p class="muted">${t('no_activity')}</p>`;$('#view-dialog').showModal();}catch(e){toast(e.message,true);}}
function invoiceRow(row={}){return `<div class="invoice-row"><label><span>${t('invoice_date')}</span><input class="invoice-date" type="date" value="${esc(row.invoice_date||'')}" required></label><label><span>${t('invoice_series')}</span><input class="invoice-series" value="${esc(row.invoice_series||'')}" placeholder="IV" maxlength="40" required></label><label><span>${t('invoice_number')}</span><input class="invoice-number" value="${esc(row.invoice_number||'')}" placeholder="8,772" maxlength="100" required></label><label><span>${t('invoice_amount')} (${currency()})</span><input class="invoice-amount" type="number" min="0.01" step="0.01" value="${row.amount??''}" required></label><button class="remove-invoice" type="button" title="${t('remove')}">×</button></div>`;}
function renderInvoiceRows(rows=[]){$('#invoice-rows').innerHTML=rows.map(invoiceRow).join('');updateInvoiceTotal();} function invoicePayload(){return $$('.invoice-row').map(row=>({invoice_date:row.querySelector('.invoice-date').value,invoice_series:row.querySelector('.invoice-series').value.trim(),invoice_number:row.querySelector('.invoice-number').value.trim(),amount:Number(row.querySelector('.invoice-amount').value||0)}));} function updateInvoiceTotal(){const total=$$('.invoice-amount').reduce((sum,input)=>sum+Number(input.value||0),0);$('#invoice-total-value').textContent=money(total);}
$('#invoice-rows').addEventListener('input',updateInvoiceTotal);$('#invoice-rows').addEventListener('click',event=>{const button=event.target.closest('.remove-invoice');if(button){button.closest('.invoice-row')?.remove();updateInvoiceTotal();}});
$('#add-invoice').addEventListener('click',()=>{$('#invoice-rows').insertAdjacentHTML('beforeend',invoiceRow());updateInvoiceTotal();});
async function openManage(id) {
  try {
    const q = normalizeQuote(await api(`${prefix()}/quotes/${id}`));
    state.quote = q;
    if (q.read_only) return toast(t('read_only'), true);

    // --- INICIO DE LÓGICA STALE QUOTE ---
    let statusToSet = ['pending', 'po', 'lost'].includes(q.status) ? q.status : 'pending';
    let lossReasonToSet = q.loss_reason;

    // Si está pendiente y tiene más de 90 días, lanzar la pregunta
    if (statusToSet === 'pending' && Number(q.quote_age_days || 0) > 90) {
      const isLost = confirm(state.language === 'es'
        ? 'Esta cotización tiene más de 90 días abierta. ¿Se perdió la operación?'
        : 'This quotation is more than 90 days old. Was it lost?');
      
      if (isLost) {
        statusToSet = 'lost';
        lossReasonToSet = 'Stale Quote';
      }
    }
    // --- FIN DE LÓGICA ---

    $('#manage-title').textContent = q.folio || '—';
    $('#manage-summary').innerHTML = detailsHtml(q);
    
    // Asignamos los valores preseleccionados
    $('#manage-status').value = statusToSet;
    $('#manage-method').value = q.follow_up_type;
    $('#manage-loss').value = lossReasonToSet;
    
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
$('#manage-form').addEventListener('submit',async e=>{e.preventDefault();try{const status=$('#manage-status').value;await api(`${prefix()}/quotes/${state.quote.id}`,{method:'PATCH',body:JSON.stringify({status,follow_up_type:$('#manage-method').value,is_safe:$('#manage-safe').checked,loss_reason:$('#manage-loss').value,comment:status==='po'?'':$('#manage-comment').value,invoices:status==='po'?invoicePayload():[]})});$('#manage-dialog').close();toast(state.language==='es'?'Seguimiento guardado':'Follow-up saved');await navigate(state.view);}catch(err){toast(err.message,true);}});

let searchTimer;$('#quote-search').addEventListener('input',()=>{clearTimeout(searchTimer);
  searchTimer=setTimeout(()=>renderList().catch(e=>toast(e.message,true)),250);
});
$('#priority-filter').addEventListener('change',()=>renderList());
$('#rank-filter').addEventListener('change',()=>renderList());
$('#quote-order').addEventListener('change',()=>renderList());
$('#status-filter').addEventListener('change',()=>renderList());

function setPreset(kind){const today=new Date();let start=new Date(today);if(kind==='weekly'){const day=(today.getDay()+6)%7;start.setDate(today.getDate()-day);}if(kind==='monthly')start=new Date(today.getFullYear(),today.getMonth(),1);const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;if(kind!=='custom'){$('#report-start').value=iso(start);$('#report-end').value=iso(today);}} $$('.report-preset').forEach(b=>b.addEventListener('click',async()=>{setPreset(b.dataset.period);if(b.dataset.period!=='custom')await renderReport();}));$('#dashboard-report').addEventListener('click',()=>{setPreset('daily');navigate('reports');});
function reportQuery(){return new URLSearchParams({start:$('#report-start').value,end:$('#report-end').value,scope:$('#report-scope').value,agent:$('#global-agent').value,language:state.language});}
async function renderReport(){if(!$('#report-start').value)setPreset('daily');const data=await api(`${prefix()}/reports/range?${reportQuery()}`);const metrics=[[data.new_quotes,t('added_today')],[data.quotes_reviewed,t('reviewed')],[data.status_changes,t('status_changes')],[data.po_changes,t('converted_po')]];const financial=[[data.pending_value,t('pending_total')],[data.po_quoted_value,t('quoted_total')],[data.po_value,t('po_total')],[Number(data.po_value)-Number(data.po_quoted_value),'Variance']];const maxPo=Math.max(1,...data.po_rows.flatMap(r=>[Number(r.quoted_total||0),Number(r.po_total||0)]));$('#report-summary').innerHTML=`<h3>${t('details')}</h3><div class="report-kpis">${metrics.map(([v,l])=>`<div><strong>${v}</strong><span>${l}</span></div>`).join('')}</div><h3>${t('financial_summary')}</h3><div class="report-kpis financial">${financial.map(([v,l])=>`<div><strong>${money(v)}</strong><span>${l}</span></div>`).join('')}</div><div class="report-grid"><section><h3>${t('loss_breakdown')}</h3>${Object.keys(data.loss_breakdown).length?Object.entries(data.loss_breakdown).map(([r,v])=>`<div class="reason-row"><span>${esc(r)}</span><b>${v}</b></div>`).join(''):`<p class="muted">${t('no_records')}</p>`}</section><section><h3>${t('po_comparison')}</h3><div class="comparison-chart">${data.po_rows.slice(0,8).map(r=>`<div class="comparison-item"><div><i class="qt" style="height:${Math.max(2,90*Number(r.quoted_total||0)/maxPo)}px"></i><i class="po" style="height:${Math.max(2,90*Number(r.po_total||0)/maxPo)}px"></i></div><small>${esc(r.folio)}</small><span>${fmtDate(r.po_date)}</span></div>`).join('')||`<p class="muted">${t('no_records')}</p>`}</div></section></div>`;const base=`${prefix()}/reports/export`;const q=reportQuery();$('#report-pdf').href=`${base}.pdf?${q}`;$('#report-xlsx').href=`${base}.xlsx?${q}`;}
$('#report-preview').addEventListener('click',()=>renderReport().catch(e=>toast(e.message,true)));$('#report-scope').addEventListener('change',()=>renderReport().catch(e=>toast(e.message,true)));

$('#upload-button').addEventListener('click',()=>{state.importToken=null;$('#upload-file').value='';$('#import-preview').classList.add('hidden');$('#confirm-import').classList.add('hidden');$('#preview-import').classList.remove('hidden');$('#upload-title').textContent=state.system==='special'?'Upload Special Quotations':'Upload Follow Up Quotations';$('#upload-help').textContent=state.system==='special'?'B date, E company, F rank, G item code, H model, I quantity, J unit price, and AA NT Tool agent. Values remain in JPY.':'A date, B series, C folio, D distributor, E total with tax, F End User, G distributor agent, I customer order, J NT Tool agent, and K internal net total. Values remain in USD.';$('#upload-dialog').showModal();});
function toBase64(buffer){let binary='';const bytes=new Uint8Array(buffer);for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(binary);}
$('#upload-form').addEventListener('submit',async e=>{e.preventDefault();const file=$('#upload-file').files[0];if(!file)return;const button=$('#preview-import');button.disabled=true;try{const data=await api(`${prefix()}/import/preview`,{method:'POST',body:JSON.stringify({filename:file.name,content_base64:toBase64(await file.arrayBuffer())})});state.importToken=data.token;$('#import-preview').classList.remove('hidden');$('#import-preview').innerHTML=`<div class="preview-metrics"><div><b>${data.rows_seen}</b><span>${t('rows')}</span></div><div><b>${data.new}</b><span>${t('new')}</span></div><div><b>${data.updated}</b><span>${t('updated')}</span></div><div><b>${data.unchanged||0}</b><span>${t('unchanged')}</span></div><div><b>${data.duplicates}</b><span>${t('duplicates')}</span></div><div><b>${data.archived||0}</b><span>${t('excluded')}</span></div><div><b>${data.errors}</b><span>${t('invalid')}</span></div></div>${data.error_detail?.length?`<div class="form-error">${data.error_detail.map(x=>`Row ${x.row}: ${esc(x.error)}`).join('<br>')}</div>`:''}`;$('#confirm-import').classList.remove('hidden');button.classList.add('hidden');}catch(err){toast(err.message,true);}finally{button.disabled=false;}});
$('#confirm-import').addEventListener('click',async()=>{if(!state.importToken)return;const button=$('#confirm-import');button.disabled=true;try{const data=await api(`${prefix()}/import/confirm`,{method:'POST',body:JSON.stringify({token:state.importToken})});$('#upload-dialog').close();toast(`${t('import_complete')}: ${data.inserted} ${t('new')}, ${data.updated} ${t('updated')}, ${data.unchanged||0} ${t('unchanged')}`);await loadAgents();await navigate('dashboard');}catch(err){toast(err.message,true);}finally{button.disabled=false;}});

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

    // --- MÉTODO INFALIBLE: Pegar el HTML directamente ---
    if (!document.getElementById('edit-role-wrapper')) {
        const htmlSelector = `
        <div id="edit-role-wrapper" style="margin: 15px 0; padding: 10px; background: #f4f6f8; border: 1px solid #cbd5e1; border-radius: 6px;">
            <span style="font-weight: bold; display: block; margin-bottom: 5px; color: #0f172a;">
                ⚙️ Rol del sistema
            </span>
            <select id="edit-role" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ccc;">
                <option value="0">Developer (Vista Completa)</option>
                <option value="1">Manager (Vista Limitada)</option>
            </select>
        </div>`;
        
        // Lo insertamos justo antes de la caja de contraseña para que no rompa tu diseño
        const cajaPassword = document.getElementById('edit-password');
        if (cajaPassword) {
            cajaPassword.insertAdjacentHTML('beforebegin', htmlSelector);
        }
    }
    
    // Asignar si es Manager (1) o Developer (0)
    document.getElementById('edit-role').value = u.management_profile ? "1" : "0";
    
    // Imprimimos tu rol en la consola para confirmar que el sistema sabe quién eres
    console.log("Tu rol actual es:", state.me?.role);
    
    // Hacemos visible la caja SOLO si eres secretadmin
    const esSecretAdmin = state.me?.role === 'secretadmin';
    document.getElementById('edit-role-wrapper').style.display = esSecretAdmin ? 'block' : 'none';

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
        
        // Si es el SecretAdmin guardando, adjuntamos la decisión del rol
        if (state.me.role === 'secretadmin') {
            payload.management_profile = $('#edit-role').value === "1";
        }

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
$('#user-edit-form').addEventListener('submit',async e=>{e.preventDefault();try{const password=$('#edit-password').value;await api(`/api/users/${$('#edit-user-id').value}`,{method:'PATCH',body:JSON.stringify({display_name:$('#edit-name').value,agent_name:$('#edit-agent').value,active:$('#edit-active').checked,password})});$('#user-edit-dialog').close();toast(password?(state.language==='es'?'Contraseña temporal guardada':'Temporary password saved'):t('save'));await renderUsers();}catch(err){toast(err.message,true);}});
$('#password-button').addEventListener('click',()=>{$('#password-notice').textContent='';$('#password-form').reset();$('#password-dialog').showModal();});
$('#password-form').addEventListener('submit',async e=>{e.preventDefault();try{await api('/api/me/password',{method:'PATCH',body:JSON.stringify({current_password:$('#current-password').value,new_password:$('#new-own-password').value})});state.me.must_change_password=0;$('#password-dialog').close();toast(t('change_password'));}catch(err){toast(err.message,true);}});  $$('.dialog-close').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));

(async function init(){try{const status=await api('/api/auth/status');const me=await api('/api/me').catch(()=>null);if(me){state.me=me;state.language=me.language||'en';$('#login-language').value=state.language;await enterApp(me);}else showLogin(status.bootstrap_required);}catch(e){showLogin(false);$('#login-error').textContent=e.message;}})();


// Invoice Excel import for confirmed USD purchase orders.
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
