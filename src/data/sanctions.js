// OFAC SDN List - US Treasury sanctioned vessels
// Source: https://www.treasury.gov/ofac/downloads/sdn.csv (public domain, free forever)
// This is a curated subset of known sanctioned vessels for demo
// In production: fetch https://www.treasury.gov/ofac/downloads/sdn.csv daily

export const SANCTIONED_VESSELS = [
  { mmsi:'477219100', imo:'IMO9256557', name:'WISDOM STAR',       flag:'Hong Kong', reason:'IRAN - Sanctions Evasion', list:'OFAC SDN', date:'2023-04-15', entity:'Noavaran Petro Kimia Co' },
  { mmsi:'273355480', imo:'IMO9116737', name:'LADY M',            flag:'Russia',    reason:'RUSSIA - SDN List',       list:'OFAC SDN', date:'2022-03-25', entity:'Sovcomflot' },
  { mmsi:'538006786', imo:'IMO9462566', name:'PACIFIC BRAVO',     flag:'Marshall Is',reason:'IRAN - Oil Exports',     list:'OFAC SDN', date:'2023-01-10', entity:'NIOC' },
  { mmsi:'511101301', imo:'IMO9256783', name:'HANA',              flag:'Palau',     reason:'IRAN - Sanctions Evasion',list:'OFAC SDN', date:'2022-11-20', entity:'Unknown' },
  { mmsi:'273358620', imo:'IMO9180602', name:'NS CONCORD',        flag:'Russia',    reason:'RUSSIA - SDN List',       list:'OFAC SDN', date:'2022-04-05', entity:'Sovcomflot' },
  { mmsi:'273357890', imo:'IMO9315943', name:'PRIMORYE',          flag:'Russia',    reason:'RUSSIA - SDN List',       list:'OFAC SDN', date:'2022-03-25', entity:'Sovcomflot' },
  { mmsi:'422204800', imo:'IMO9354687', name:'DABAN 3',           flag:'Iran',      reason:'IRAN - IRGC Vessel',      list:'OFAC SDN', date:'2023-06-01', entity:'IRGC' },
  { mmsi:'422335600', imo:'IMO9176187', name:'IRAN ABAN',         flag:'Iran',      reason:'IRAN - NITC',             list:'OFAC SDN', date:'2012-03-30', entity:'NITC' },
  { mmsi:'440337000', imo:'IMO9228186', name:'LIGHTHOUSE',        flag:'North Korea',reason:'DPRK - Sanctions',       list:'OFAC SDN', date:'2023-02-15', entity:'Unknown' },
  { mmsi:'273318020', imo:'IMO9015653', name:'SPARTA III',        flag:'Russia',    reason:'RUSSIA - SDN List',       list:'OFAC SDN', date:'2022-04-05', entity:'Oboronlogistika' },
];

// EU sanctions list (curated subset)
export const EU_SANCTIONED = [
  { mmsi:'273355480', imo:'IMO9116737', name:'LADY M',      flag:'Russia', reason:'EU Russia Sanctions Reg 833/2014' },
  { mmsi:'273358620', imo:'IMO9180602', name:'NS CONCORD',  flag:'Russia', reason:'EU Russia Sanctions Reg 833/2014' },
  { mmsi:'273357890', imo:'IMO9315943', name:'PRIMORYE',    flag:'Russia', reason:'EU Russia Sanctions Reg 833/2014' },
  { mmsi:'273318020', imo:'IMO9015653', name:'SPARTA III',  flag:'Russia', reason:'EU Russia Sanctions Reg 833/2014' },
];

// High risk flags - vessels from these countries need extra scrutiny
export const HIGH_RISK_FLAGS = [
  { flag:'Iran',        risk:'CRITICAL', reason:'US/EU/UN sanctions - OFAC SDN automatic screening required' },
  { flag:'North Korea', risk:'CRITICAL', reason:'UN Security Council sanctions - all vessels prohibited' },
  { flag:'Russia',      risk:'HIGH',     reason:'EU/US sanctions since Feb 2022 - enhanced due diligence' },
  { flag:'Syria',       risk:'HIGH',     reason:'US/EU sanctions - financing restrictions apply' },
  { flag:'Venezuela',   risk:'MEDIUM',   reason:'US OFAC sanctions on state oil company PDVSA' },
  { flag:'Myanmar',     risk:'MEDIUM',   reason:'US/EU targeted sanctions - enhanced due diligence' },
  { flag:'Belarus',     risk:'MEDIUM',   reason:'EU sanctions since 2020' },
];

// AIS dark activity patterns (vessels that frequently disable transponders)
export const DARK_VESSEL_PATTERNS = [
  { imo:'IMO9256557', incidents:8,  lastDark:'Persian Gulf',    suspicion:'Suspected Iranian oil transfer' },
  { imo:'IMO9462566', incidents:5,  lastDark:'Strait of Hormuz',suspicion:'Suspected sanctions evasion' },
  { imo:'IMO9354687', incidents:12, lastDark:'Gulf of Oman',    suspicion:'Ship-to-ship transfer activity' },
];

// Recent name/flag changes (classic evasion tactic)
export const VESSEL_CHANGES = [
  { currentName:'PACIFIC BRAVO', previousName:'IRAN EXPRESS',  changeDate:'2022-08-15', flagChange:'Iran → Marshall Islands' },
  { currentName:'HANA',          previousName:'SANCHI',        changeDate:'2021-03-20', flagChange:'Iran → Palau' },
];

export function screenVessel(vessel) {
  const results = {
    riskLevel: 'CLEAR',
    riskColor: '#10B981',
    riskBg: 'rgba(16,185,129,0.1)',
    flags: [],
    ofacMatch: null,
    euMatch: null,
    flagRisk: null,
    darkActivity: null,
    nameChange: null,
    recommendation: 'No sanctions concerns identified. Standard due diligence applies.',
  };

  // Check OFAC SDN list
  const ofac = SANCTIONED_VESSELS.find(s =>
    s.mmsi === vessel.mmsi ||
    s.imo === vessel.imo ||
    s.name.toLowerCase() === (vessel.name||'').toLowerCase()
  );
  if (ofac) {
    results.ofacMatch = ofac;
    results.riskLevel = 'BLOCKED';
    results.riskColor = '#EF4444';
    results.riskBg = 'rgba(239,68,68,0.1)';
    results.flags.push({ level:'CRITICAL', text:`OFAC SDN Match: ${ofac.reason}` });
    results.recommendation = 'DO NOT FINANCE. Vessel on OFAC SDN List. Transaction prohibited under IEEPA/OFAC regulations.';
  }

  // Check EU sanctions
  const eu = EU_SANCTIONED.find(s => s.mmsi === vessel.mmsi || s.imo === vessel.imo);
  if (eu && !ofac) {
    results.euMatch = eu;
    results.riskLevel = 'BLOCKED';
    results.riskColor = '#EF4444';
    results.riskBg = 'rgba(239,68,68,0.1)';
    results.flags.push({ level:'CRITICAL', text:`EU Sanctions Match: ${eu.reason}` });
    results.recommendation = 'DO NOT FINANCE. Vessel subject to EU sanctions. Transaction prohibited for EU entities.';
  }

  // Check high risk flag
  const flagRisk = HIGH_RISK_FLAGS.find(f =>
    (vessel.flag||'').toLowerCase().includes(f.flag.toLowerCase())
  );
  if (flagRisk) {
    results.flagRisk = flagRisk;
    if (results.riskLevel === 'CLEAR') {
      results.riskLevel = flagRisk.risk;
      results.riskColor = flagRisk.risk === 'CRITICAL' ? '#EF4444' : flagRisk.risk === 'HIGH' ? '#F59E0B' : '#F97316';
      results.riskBg = flagRisk.risk === 'CRITICAL' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)';
      results.recommendation = flagRisk.risk === 'CRITICAL'
        ? 'REJECT. Flag state under comprehensive sanctions. Financing prohibited.'
        : 'ENHANCED DUE DILIGENCE REQUIRED. High-risk flag state. Obtain additional documentation before proceeding.';
    }
    results.flags.push({ level: flagRisk.risk, text: `High-risk flag: ${flagRisk.flag} — ${flagRisk.reason}` });
  }

  // Check dark vessel activity
  const dark = DARK_VESSEL_PATTERNS.find(d => d.imo === vessel.imo);
  if (dark) {
    results.darkActivity = dark;
    if (results.riskLevel === 'CLEAR') {
      results.riskLevel = 'HIGH';
      results.riskColor = '#F59E0B';
      results.riskBg = 'rgba(245,158,11,0.1)';
      results.recommendation = 'ENHANCED DUE DILIGENCE. Vessel has history of AIS transponder deactivation.';
    }
    results.flags.push({ level:'HIGH', text:`AIS dark activity: ${dark.incidents} incidents — ${dark.suspicion}` });
  }

  // Check name/flag changes
  const change = VESSEL_CHANGES.find(c =>
    c.currentName.toLowerCase() === (vessel.name||'').toLowerCase() ||
    c.previousName.toLowerCase() === (vessel.name||'').toLowerCase()
  );
  if (change) {
    results.nameChange = change;
    if (results.riskLevel === 'CLEAR') {
      results.riskLevel = 'MEDIUM';
      results.riskColor = '#F97316';
      results.riskBg = 'rgba(249,115,22,0.1)';
    }
    results.flags.push({ level:'MEDIUM', text:`Name/flag change detected: ${change.previousName} → ${change.currentName} (${change.flagChange})` });
  }

  return results;
}
