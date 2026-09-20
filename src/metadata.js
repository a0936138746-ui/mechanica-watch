// Educational descriptions: general mechanical-watch principles, not a real calibre.
const groups={
 gear:['輪系','Gear train','Brass / steel','以相互嚙合的齒輪傳遞旋轉與動力。','Meshing wheels transmit rotation and power.'],
 bridge:['支承結構','Movement support','Brushed / polished steel','支承輪軸，保持零件的相對位置。','Supports wheel pivots and maintains their relative positions.'],
 case:['錶殼','Case','Steel / sapphire','容納與保護機芯，形成腕錶外部結構。','Houses and protects the movement.'],
 calendar:['日曆機構','Calendar','Steel / brass','協助日期環逐格前進與定位。','Advances and positions the date ring.'],
 hand:['時間顯示','Time display','Blued steel / luminous inlay','以指針位置顯示時間。','Indicates time through the position of a hand.'],
 screw:['固定件','Fastener','Blued steel','固定橋板或支承零件。','Secures bridges or supporting components.'],
};
const entries={
 'AX':['輪軸','bridge'],'SP':['橋板支柱','bridge'],'ST':['上鍊軸','gear'],'CH':['時標圈','hand'],'MP':['主底板','bridge'],'CR':['機芯固定環','bridge'],'SF':['下層輪系支架','bridge'],
 'BR':['鏤空上橋板','bridge'],'BC':['擺輪橋板與調節器','bridge'],
 'GR':['傳動齒輪','gear'],'PN':['小齒輪支架','bridge'],'LG':['下層輪系支承','bridge'],
 'SC':['橋板固定螺絲','screw'],'MC':['錶殼與錶耳','case'],'BZ':['拋光錶圈','case'],
 'FC':['前藍寶石鏡面','case'],'CB':['透背底蓋環','case'],'RC':['後藍寶石鏡面','case'],
 'DS':['鏤空面盤','hand'],'HC':['指針軸與軸帽','hand'],
 'HH':['時針','hand'],'HM':['分針','hand'],'HS':['秒針','hand'],
 'DW':['日期環','calendar'],'DT':['日期視窗','calendar'],'CG':['日曆傳動輪','calendar'],'CJ':['日期定位簧','calendar'],
 'MB':['發條盒','gear'],'BW':['擺輪','gear'],'HR':['游絲','gear'],'EF':['擒縱叉','gear'],'CW':['錶冠','gear'],'WR':['上鍊撥桿','gear'],
};
const custom={
 'AX':['輪軸','Wheel arbor','Steel','支承旋轉零件，並將旋轉傳遞至同軸零件。','Supports rotating wheels and transmits rotation to coaxial components.'],
 'ST':['上鍊與調時','Winding / setting','Steel','將錶冠的旋轉傳入上鍊與調時機構。','Transfers crown rotation into the winding and setting mechanism.'],
 'MB':['動力儲存','Power reserve','Spring steel / brass','發條儲存能量，經發條盒向輪系釋放動力。','The mainspring stores energy; the barrel delivers it to the train.'],
 'BW':['振盪系統','Oscillator','Brass / steel / synthetic ruby','擺輪與游絲共同往復振盪，提供機芯的時間基準。','The balance and hairspring oscillate together to provide a timing reference.'],
 'HR':['振盪系統','Oscillator','Blued spring steel','游絲提供回復力，使擺輪往復擺動。','The hairspring supplies restoring torque to the balance.'],
 'EF':['擒縱系統','Escapement','Steel / synthetic ruby','交替鎖住與釋放擒縱輪，並將衝量傳給擺輪。','Alternately locks and releases the escape wheel and transmits impulses to the balance.'],
 'CW':['上鍊與調時','Winding / setting','Steel','透過上鍊軸操作上鍊與指針調校機構。','Operates winding and hand-setting mechanisms through the stem.'],
 'DW':['日曆顯示','Date display','Printed metal','承載 1 至 31 的日期數字，由日期視窗讀取。','Carries numerals 1–31, read through the date aperture.'],
 'DT':['日曆顯示','Date display','Polished steel','框出日期環上的當前日期。','Frames the current numeral on the date ring.'],
 'DS':['時間顯示','Time display','Steel / luminous inlay','提供讀取指針位置的時標。','Provides hour markers for reading the hands.'],
};
export function enrichMetadata(parts){for(const p of parts){const d=p.userData,k=p.name.split('-')[0],[zh,g]=entries[k],v=custom[k]||groups[g];Object.assign(d,{name_zh:zh,name_en:d.name,category_zh:v[0],category_en:v[1],material:v[2],function_zh:v[3],function_en:v[4],assembly_layer:d.layer_id});const categories={case:'CASE',hand:'DISPLAY',calendar:'CALENDAR',bridge:'BRIDGES',screw:'BRIDGES',gear:'GEAR TRAIN'};d.explorer_category=categories[g];if(['BW','HR','BC'].includes(k))d.explorer_category='BALANCE';if(k==='EF'||p.name==='GR-006')d.explorer_category='ESCAPEMENT';if(k==='MB'||p.name==='GR-003')d.explorer_category='POWER';if(['CW','ST','WR'].includes(k))d.explorer_category='CONTROL';if(p.name==='GR-002')d.name_zh='第三輪';if(p.name==='GR-003')d.name_zh='棘輪';if(p.name==='GR-014'){d.name_zh='上鍊輪';d.name_en='Winding wheel';}if(k==='GR'&&Number(p.name.slice(3))>=11&&Number(p.name.slice(3))<=13)d.name_zh='減速小齒輪 '+(Number(p.name.slice(3))-10);if(p.name==='GR-006')Object.assign(d,{name_zh:'擒縱輪',function_zh:'與擒縱叉交互作用，將輪系動力轉為間歇衝量。',function_en:'Works with the pallet fork to deliver intermittent impulses.'});}}
