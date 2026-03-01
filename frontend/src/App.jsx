import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const API = 'https://farewatch-7qud.onrender.com/api'

// ── Theme ─────────────────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg: '#111128', surface: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)',
    text: '#fff', muted: '#7ecfff', accent: '#00e5ff', accentGrad: 'linear-gradient(135deg,#00e5ff,#0072ff)',
    sidebar: '#14142e', sidebarBorder: 'rgba(255,255,255,0.06)', input: 'rgba(255,255,255,0.06)',
    card: 'rgba(255,255,255,0.07)', cardBorder: 'rgba(255,255,255,0.07)',
    chartGrid: 'rgba(255,255,255,0.05)', tooltipBg: 'rgba(10,10,20,0.95)',
    pillActive: 'rgba(0,229,255,0.1)', pillActiveBorder: '#00e5ff55',
    calBg: '#252548', calHover: 'rgba(0,229,255,0.12)', calSelected: '#00e5ff',
    danger: '#ff4d6d', success: '#00ff87', warning: '#ffd60a',
  },
  light: {
    bg: '#f0f4f8', surface: 'rgba(255,255,255,0.9)', border: 'rgba(0,0,0,0.08)',
    text: '#0f172a', muted: '#64748b', accent: '#0072ff', accentGrad: 'linear-gradient(135deg,#0072ff,#00c6ff)',
    sidebar: '#fff', sidebarBorder: 'rgba(0,0,0,0.06)', input: 'rgba(0,0,0,0.04)',
    card: 'rgba(255,255,255,0.8)', cardBorder: 'rgba(0,0,0,0.06)',
    chartGrid: 'rgba(0,0,0,0.05)', tooltipBg: 'rgba(255,255,255,0.98)',
    pillActive: 'rgba(0,114,255,0.1)', pillActiveBorder: '#0072ff55',
    calBg: '#fff', calHover: 'rgba(0,114,255,0.08)', calSelected: '#0072ff',
    danger: '#ef4444', success: '#10b981', warning: '#f59e0b',
  }
}

// ── Airline Data ──────────────────────────────────────────────────────────────
const AIRLINES = {
  BA: { name: 'British Airways', url: 'https://www.britishairways.com' },
  AA: { name: 'American Airlines', url: 'https://www.aa.com' },
  UA: { name: 'United Airlines', url: 'https://www.united.com' },
  DL: { name: 'Delta Air Lines', url: 'https://www.delta.com' },
  LH: { name: 'Lufthansa', url: 'https://www.lufthansa.com' },
  AF: { name: 'Air France', url: 'https://www.airfrance.com' },
  KL: { name: 'KLM', url: 'https://www.klm.com' },
  IB: { name: 'Iberia', url: 'https://www.iberia.com' },
  VY: { name: 'Vueling', url: 'https://www.vueling.com' },
  FR: { name: 'Ryanair', url: 'https://www.ryanair.com' },
  U2: { name: 'easyJet', url: 'https://www.easyjet.com' },
  W6: { name: 'Wizz Air', url: 'https://wizzair.com' },
  LS: { name: 'Jet2', url: 'https://www.jet2.com' },
  EW: { name: 'Eurowings', url: 'https://www.eurowings.com' },
  EK: { name: 'Emirates', url: 'https://www.emirates.com' },
  QR: { name: 'Qatar Airways', url: 'https://www.qatarairways.com' },
  EY: { name: 'Etihad Airways', url: 'https://www.etihad.com' },
  TK: { name: 'Turkish Airlines', url: 'https://www.turkishairlines.com' },
  SQ: { name: 'Singapore Airlines', url: 'https://www.singaporeair.com' },
  CX: { name: 'Cathay Pacific', url: 'https://www.cathaypacific.com' },
  QF: { name: 'Qantas', url: 'https://www.qantas.com' },
  AC: { name: 'Air Canada', url: 'https://www.aircanada.com' },
  WS: { name: 'WestJet', url: 'https://www.westjet.com' },
  LX: { name: 'Swiss', url: 'https://www.swiss.com' },
  OS: { name: 'Austrian Airlines', url: 'https://www.austrian.com' },
  SN: { name: 'Brussels Airlines', url: 'https://www.brusselsairlines.com' },
  TP: { name: 'TAP Portugal', url: 'https://www.flytap.com' },
  AZ: { name: 'ITA Airways', url: 'https://www.itaairways.com' },
  SK: { name: 'SAS', url: 'https://www.flysas.com' },
  AY: { name: 'Finnair', url: 'https://www.finnair.com' },
  LO: { name: 'LOT Polish', url: 'https://www.lot.com' },
  OK: { name: 'Czech Airlines', url: 'https://www.csa.cz' },
  RO: { name: 'TAROM', url: 'https://www.tarom.ro' },
  FB: { name: 'Bulgaria Air', url: 'https://www.air.bg' },
  A3: { name: 'Aegean Airlines', url: 'https://en.aegeanair.com' },
  OA: { name: 'Olympic Air', url: 'https://www.olympicair.com' },
  VS: { name: 'Virgin Atlantic', url: 'https://www.virginatlantic.com' },
  BY: { name: 'TUI Airways', url: 'https://www.tui.co.uk' },
  I2: { name: 'Iberia Express', url: 'https://www.iberiaexpress.com' },
  UX: { name: 'Air Europa', url: 'https://www.aireuropa.com' },
  NT: { name: 'Binter Canarias', url: 'https://www.bintercanarias.com' },
  ZI: { name: 'Aigle Azur', url: 'https://www.aigle-azur.com' },
  TO: { name: 'Transavia France', url: 'https://www.transavia.com' },
  HV: { name: 'Transavia', url: 'https://www.transavia.com' },
  PC: { name: 'Pegasus Airlines', url: 'https://www.flypgs.com' },
  XQ: { name: 'SunExpress', url: 'https://www.sunexpress.com' },
  DE: { name: 'Condor', url: 'https://www.condor.com' },
  X3: { name: 'TUI fly', url: 'https://www.tuifly.com' },
  '6B': { name: 'TUIfly Nordic', url: 'https://www.tuifly.com' },
  DY: { name: 'Norwegian', url: 'https://www.norwegian.com' },
  D8: { name: 'Norwegian', url: 'https://www.norwegian.com' },
  WF: { name: 'Wideroe', url: 'https://www.wideroe.no' },
  FI: { name: 'Icelandair', url: 'https://www.icelandair.com' },
  TF: { name: 'Braathens Regional', url: 'https://www.braathensregional.se' },
  BT: { name: 'airBaltic', url: 'https://www.airbaltic.com' },
  CI: { name: 'China Airlines', url: 'https://www.china-airlines.com' },
  MU: { name: 'China Eastern', url: 'https://www.ceair.com' },
  CA: { name: 'Air China', url: 'https://www.airchina.com' },
  CZ: { name: 'China Southern', url: 'https://www.csair.com' },
  MH: { name: 'Malaysia Airlines', url: 'https://www.malaysiaairlines.com' },
  TG: { name: 'Thai Airways', url: 'https://www.thaiairways.com' },
  GA: { name: 'Garuda Indonesia', url: 'https://www.garuda-indonesia.com' },
  NH: { name: 'ANA', url: 'https://www.ana.co.jp' },
  JL: { name: 'Japan Airlines', url: 'https://www.jal.com' },
  KE: { name: 'Korean Air', url: 'https://www.koreanair.com' },
  OZ: { name: 'Asiana Airlines', url: 'https://flyasiana.com' },
  AI: { name: 'Air India', url: 'https://www.airindia.com' },
  '6E': { name: 'IndiGo', url: 'https://www.goindigo.in' },
  SV: { name: 'Saudia', url: 'https://www.saudia.com' },
  GF: { name: 'Gulf Air', url: 'https://www.gulfair.com' },
  WY: { name: 'Oman Air', url: 'https://www.omanair.com' },
  ET: { name: 'Ethiopian Airlines', url: 'https://www.ethiopianairlines.com' },
  SA: { name: 'South African Airways', url: 'https://www.flysaa.com' },
  MS: { name: 'EgyptAir', url: 'https://www.egyptair.com' },
  AT: { name: 'Royal Air Maroc', url: 'https://www.royalairmaroc.com' },
  CM: { name: 'Copa Airlines', url: 'https://www.copaair.com' },
  AV: { name: 'Avianca', url: 'https://www.avianca.com' },
  LA: { name: 'LATAM Airlines', url: 'https://www.latam.com' },
  'G3': { name: 'Gol Airlines', url: 'https://www.voegol.com.br' },
  AR: { name: 'Aerolineas Argentinas', url: 'https://www.aerolineas.com.ar' },
  B6: { name: 'JetBlue', url: 'https://www.jetblue.com' },
  WN: { name: 'Southwest Airlines', url: 'https://www.southwest.com' },
  F9: { name: 'Frontier Airlines', url: 'https://www.flyfrontier.com' },
  NK: { name: 'Spirit Airlines', url: 'https://www.spirit.com' },
  GQ: { name: 'Sky Express', url: 'https://www.sky.gr' },
  KM: { name: 'Air Malta', url: 'https://www.airmalta.com' },
}

function getAirlineName(code) { return AIRLINES[code]?.name ?? code }
function getAirlineUrl(code) { return AIRLINES[code]?.url ?? null }

// ── Full Airport Database ─────────────────────────────────────────────────────
const AIRPORTS = [
  // UK
  { code: 'LHR', name: 'Heathrow', city: 'London', country: 'UK' },
  { code: 'LGW', name: 'Gatwick', city: 'London', country: 'UK' },
  { code: 'STN', name: 'Stansted', city: 'London', country: 'UK' },
  { code: 'LTN', name: 'Luton', city: 'London', country: 'UK' },
  { code: 'LCY', name: 'City Airport', city: 'London', country: 'UK' },
  { code: 'SEN', name: 'Southend', city: 'London', country: 'UK' },
  { code: 'MAN', name: 'Manchester', city: 'Manchester', country: 'UK' },
  { code: 'EDI', name: 'Edinburgh', city: 'Edinburgh', country: 'UK' },
  { code: 'BHX', name: 'Birmingham', city: 'Birmingham', country: 'UK' },
  { code: 'GLA', name: 'Glasgow', city: 'Glasgow', country: 'UK' },
  { code: 'BRS', name: 'Bristol', city: 'Bristol', country: 'UK' },
  { code: 'NCL', name: 'Newcastle', city: 'Newcastle', country: 'UK' },
  { code: 'LBA', name: 'Leeds Bradford', city: 'Leeds', country: 'UK' },
  { code: 'EMA', name: 'East Midlands', city: 'Nottingham', country: 'UK' },
  { code: 'ABZ', name: 'Aberdeen', city: 'Aberdeen', country: 'UK' },
  { code: 'BFS', name: 'Belfast Intl', city: 'Belfast', country: 'UK' },
  { code: 'BHD', name: 'George Best City', city: 'Belfast', country: 'UK' },
  { code: 'INV', name: 'Inverness', city: 'Inverness', country: 'UK' },
  { code: 'SOU', name: 'Southampton', city: 'Southampton', country: 'UK' },
  { code: 'EXT', name: 'Exeter', city: 'Exeter', country: 'UK' },
  { code: 'CWL', name: 'Cardiff', city: 'Cardiff', country: 'UK' },
  { code: 'DSA', name: 'Doncaster Sheffield', city: 'Doncaster', country: 'UK' },
  // Ireland
  { code: 'DUB', name: 'Dublin Intl', city: 'Dublin', country: 'IE' },
  { code: 'ORK', name: 'Cork', city: 'Cork', country: 'IE' },
  { code: 'SNN', name: 'Shannon', city: 'Shannon', country: 'IE' },
  // Spain
  { code: 'MAD', name: 'Barajas', city: 'Madrid', country: 'ES' },
  { code: 'BCN', name: 'El Prat', city: 'Barcelona', country: 'ES' },
  { code: 'AGP', name: 'Costa del Sol', city: 'Malaga', country: 'ES' },
  { code: 'ALC', name: 'Alicante-Elche', city: 'Alicante', country: 'ES' },
  { code: 'PMI', name: 'Son Sant Joan', city: 'Palma de Mallorca', country: 'ES' },
  { code: 'IBZ', name: 'Ibiza', city: 'Ibiza', country: 'ES' },
  { code: 'SVQ', name: 'San Pablo', city: 'Seville', country: 'ES' },
  { code: 'VLC', name: 'Valencia', city: 'Valencia', country: 'ES' },
  { code: 'TFS', name: 'Tenerife South', city: 'Tenerife', country: 'ES' },
  { code: 'TFN', name: 'Tenerife North', city: 'Tenerife', country: 'ES' },
  { code: 'LPA', name: 'Gran Canaria', city: 'Las Palmas', country: 'ES' },
  { code: 'FUE', name: 'Fuerteventura', city: 'Fuerteventura', country: 'ES' },
  { code: 'ACE', name: 'Lanzarote', city: 'Lanzarote', country: 'ES' },
  { code: 'GRX', name: 'Federico Garcia Lorca', city: 'Granada', country: 'ES' },
  { code: 'BIO', name: 'Bilbao', city: 'Bilbao', country: 'ES' },
  { code: 'SCQ', name: 'Santiago de Compostela', city: 'Santiago', country: 'ES' },
  { code: 'OVD', name: 'Asturias', city: 'Asturias', country: 'ES' },
  { code: 'MAH', name: 'Menorca', city: 'Menorca', country: 'ES' },
  // Portugal
  { code: 'LIS', name: 'Humberto Delgado', city: 'Lisbon', country: 'PT' },
  { code: 'OPO', name: 'Francisco Sa Carneiro', city: 'Porto', country: 'PT' },
  { code: 'FAO', name: 'Faro', city: 'Faro', country: 'PT' },
  { code: 'FNC', name: 'Madeira', city: 'Madeira', country: 'PT' },
  { code: 'PDL', name: 'Joao Paulo II', city: 'Azores', country: 'PT' },
  // France
  { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'FR' },
  { code: 'ORY', name: 'Orly', city: 'Paris', country: 'FR' },
  { code: 'NCE', name: "Cote d'Azur", city: 'Nice', country: 'FR' },
  { code: 'MRS', name: 'Provence', city: 'Marseille', country: 'FR' },
  { code: 'LYS', name: 'Saint-Exupery', city: 'Lyon', country: 'FR' },
  { code: 'TLS', name: 'Toulouse-Blagnac', city: 'Toulouse', country: 'FR' },
  { code: 'BOD', name: 'Merignac', city: 'Bordeaux', country: 'FR' },
  { code: 'NTE', name: 'Atlantique', city: 'Nantes', country: 'FR' },
  { code: 'BIQ', name: 'Biarritz', city: 'Biarritz', country: 'FR' },
  { code: 'MPL', name: 'Montpellier', city: 'Montpellier', country: 'FR' },
  // Germany
  { code: 'FRA', name: 'Frankfurt Intl', city: 'Frankfurt', country: 'DE' },
  { code: 'MUC', name: 'Munich Intl', city: 'Munich', country: 'DE' },
  { code: 'BER', name: 'Brandenburg', city: 'Berlin', country: 'DE' },
  { code: 'DUS', name: 'Dusseldorf', city: 'Dusseldorf', country: 'DE' },
  { code: 'HAM', name: 'Hamburg', city: 'Hamburg', country: 'DE' },
  { code: 'STR', name: 'Stuttgart', city: 'Stuttgart', country: 'DE' },
  { code: 'CGN', name: 'Cologne Bonn', city: 'Cologne', country: 'DE' },
  { code: 'HAJ', name: 'Hannover', city: 'Hannover', country: 'DE' },
  { code: 'NUE', name: 'Nuremberg', city: 'Nuremberg', country: 'DE' },
  // Italy
  { code: 'FCO', name: 'Fiumicino', city: 'Rome', country: 'IT' },
  { code: 'CIA', name: 'Ciampino', city: 'Rome', country: 'IT' },
  { code: 'MXP', name: 'Malpensa', city: 'Milan', country: 'IT' },
  { code: 'LIN', name: 'Linate', city: 'Milan', country: 'IT' },
  { code: 'BGY', name: 'Orio al Serio', city: 'Bergamo', country: 'IT' },
  { code: 'NAP', name: 'Naples Intl', city: 'Naples', country: 'IT' },
  { code: 'VCE', name: 'Marco Polo', city: 'Venice', country: 'IT' },
  { code: 'BLQ', name: 'Guglielmo Marconi', city: 'Bologna', country: 'IT' },
  { code: 'FLR', name: 'Peretola', city: 'Florence', country: 'IT' },
  { code: 'PSA', name: 'Galileo Galilei', city: 'Pisa', country: 'IT' },
  { code: 'CTA', name: 'Fontanarossa', city: 'Catania', country: 'IT' },
  { code: 'PMO', name: 'Falcone Borsellino', city: 'Palermo', country: 'IT' },
  { code: 'BRI', name: 'Palese', city: 'Bari', country: 'IT' },
  { code: 'CAG', name: 'Elmas', city: 'Cagliari', country: 'IT' },
  { code: 'OLB', name: 'Costa Smeralda', city: 'Olbia', country: 'IT' },
  { code: 'VRN', name: 'Catullo', city: 'Verona', country: 'IT' },
  // Netherlands / Belgium / Switzerland / Austria
  { code: 'AMS', name: 'Schiphol', city: 'Amsterdam', country: 'NL' },
  { code: 'EIN', name: 'Eindhoven', city: 'Eindhoven', country: 'NL' },
  { code: 'BRU', name: 'Brussels Intl', city: 'Brussels', country: 'BE' },
  { code: 'CRL', name: 'Brussels South', city: 'Charleroi', country: 'BE' },
  { code: 'ZRH', name: 'Zurich Intl', city: 'Zurich', country: 'CH' },
  { code: 'GVA', name: 'Geneva Intl', city: 'Geneva', country: 'CH' },
  { code: 'VIE', name: 'Vienna Intl', city: 'Vienna', country: 'AT' },
  { code: 'SZG', name: 'Salzburg', city: 'Salzburg', country: 'AT' },
  { code: 'INN', name: 'Innsbruck', city: 'Innsbruck', country: 'AT' },
  // Scandinavia
  { code: 'CPH', name: 'Kastrup', city: 'Copenhagen', country: 'DK' },
  { code: 'ARN', name: 'Arlanda', city: 'Stockholm', country: 'SE' },
  { code: 'GOT', name: 'Landvetter', city: 'Gothenburg', country: 'SE' },
  { code: 'OSL', name: 'Gardermoen', city: 'Oslo', country: 'NO' },
  { code: 'BGO', name: 'Flesland', city: 'Bergen', country: 'NO' },
  { code: 'HEL', name: 'Helsinki Vantaa', city: 'Helsinki', country: 'FI' },
  { code: 'KEF', name: 'Keflavik Intl', city: 'Reykjavik', country: 'IS' },
  // Greece
  { code: 'ATH', name: 'Eleftherios Venizelos', city: 'Athens', country: 'GR' },
  { code: 'SKG', name: 'Makedonia', city: 'Thessaloniki', country: 'GR' },
  { code: 'HER', name: 'Nikos Kazantzakis', city: 'Heraklion', country: 'GR' },
  { code: 'RHO', name: 'Diagoras', city: 'Rhodes', country: 'GR' },
  { code: 'CFU', name: 'Ioannis Kapodistrias', city: 'Corfu', country: 'GR' },
  { code: 'KGS', name: 'Kos', city: 'Kos', country: 'GR' },
  { code: 'ZTH', name: 'Zakynthos', city: 'Zakynthos', country: 'GR' },
  { code: 'JMK', name: 'Mykonos', city: 'Mykonos', country: 'GR' },
  { code: 'JTR', name: 'Santorini', city: 'Santorini', country: 'GR' },
  { code: 'EFL', name: 'Kefallinia', city: 'Kefalonia', country: 'GR' },
  // Turkey
  { code: 'IST', name: 'Istanbul Intl', city: 'Istanbul', country: 'TR' },
  { code: 'SAW', name: 'Sabiha Gokcen', city: 'Istanbul', country: 'TR' },
  { code: 'ADB', name: 'Adnan Menderes', city: 'Izmir', country: 'TR' },
  { code: 'AYT', name: 'Antalya', city: 'Antalya', country: 'TR' },
  { code: 'DLM', name: 'Dalaman', city: 'Dalaman', country: 'TR' },
  { code: 'BJV', name: 'Milas-Bodrum', city: 'Bodrum', country: 'TR' },
  // Eastern Europe
  { code: 'PRG', name: 'Vaclav Havel', city: 'Prague', country: 'CZ' },
  { code: 'BUD', name: 'Ferenc Liszt', city: 'Budapest', country: 'HU' },
  { code: 'WAW', name: 'Chopin', city: 'Warsaw', country: 'PL' },
  { code: 'KRK', name: 'John Paul II', city: 'Krakow', country: 'PL' },
  { code: 'WRO', name: 'Copernicus', city: 'Wroclaw', country: 'PL' },
  { code: 'GDN', name: 'Lech Walesa', city: 'Gdansk', country: 'PL' },
  { code: 'SOF', name: 'Sofia', city: 'Sofia', country: 'BG' },
  { code: 'OTP', name: 'Henri Coanda', city: 'Bucharest', country: 'RO' },
  { code: 'SCV', name: 'Stefan cel Mare', city: 'Suceava', country: 'RO' },
  { code: 'CLJ', name: 'Cluj-Napoca Intl', city: 'Cluj-Napoca', country: 'RO' },
  { code: 'TSR', name: 'Timisoara Intl', city: 'Timisoara', country: 'RO' },
  { code: 'IAS', name: 'Iasi Intl', city: 'Iasi', country: 'RO' },
  { code: 'CND', name: 'Mihail Kogalniceanu', city: 'Constanta', country: 'RO' },
  { code: 'OMR', name: 'Oradea', city: 'Oradea', country: 'RO' },
  { code: 'SBZ', name: 'Sibiu Intl', city: 'Sibiu', country: 'RO' },
  { code: 'TGM', name: 'Transilvania', city: 'Targu Mures', country: 'RO' },
  { code: 'BCM', name: 'Bacau Intl', city: 'Bacau', country: 'RO' },
  { code: 'BEG', name: 'Nikola Tesla', city: 'Belgrade', country: 'RS' },
  { code: 'ZAG', name: 'Zagreb', city: 'Zagreb', country: 'HR' },
  { code: 'SPU', name: 'Split', city: 'Split', country: 'HR' },
  { code: 'DBV', name: 'Dubrovnik', city: 'Dubrovnik', country: 'HR' },
  { code: 'LJU', name: 'Joze Pucnik', city: 'Ljubljana', country: 'SI' },
  { code: 'TIA', name: 'Mother Teresa', city: 'Tirana', country: 'AL' },
  { code: 'VNO', name: 'Vilnius', city: 'Vilnius', country: 'LT' },
  { code: 'RIX', name: 'Riga', city: 'Riga', country: 'LV' },
  { code: 'TLL', name: 'Lennart Meri', city: 'Tallinn', country: 'EE' },
  { code: 'TBS', name: 'Shota Rustaveli', city: 'Tbilisi', country: 'GE' },
  { code: 'EVN', name: 'Zvartnots', city: 'Yerevan', country: 'AM' },
  { code: 'GYD', name: 'Heydar Aliyev', city: 'Baku', country: 'AZ' },
  // Middle East
  { code: 'DXB', name: 'Dubai Intl', city: 'Dubai', country: 'AE' },
  { code: 'AUH', name: 'Abu Dhabi Intl', city: 'Abu Dhabi', country: 'AE' },
  { code: 'SHJ', name: 'Sharjah Intl', city: 'Sharjah', country: 'AE' },
  { code: 'DOH', name: 'Hamad Intl', city: 'Doha', country: 'QA' },
  { code: 'KWI', name: 'Kuwait Intl', city: 'Kuwait City', country: 'KW' },
  { code: 'BAH', name: 'Bahrain Intl', city: 'Manama', country: 'BH' },
  { code: 'MCT', name: 'Muscat Intl', city: 'Muscat', country: 'OM' },
  { code: 'AMM', name: 'Queen Alia Intl', city: 'Amman', country: 'JO' },
  { code: 'TLV', name: 'Ben Gurion', city: 'Tel Aviv', country: 'IL' },
  { code: 'RUH', name: 'King Khalid Intl', city: 'Riyadh', country: 'SA' },
  { code: 'JED', name: 'King Abdulaziz Intl', city: 'Jeddah', country: 'SA' },
  // Asia
  { code: 'SIN', name: 'Changi', city: 'Singapore', country: 'SG' },
  { code: 'HKG', name: 'Hong Kong Intl', city: 'Hong Kong', country: 'HK' },
  { code: 'NRT', name: 'Narita Intl', city: 'Tokyo', country: 'JP' },
  { code: 'HND', name: 'Haneda', city: 'Tokyo', country: 'JP' },
  { code: 'KIX', name: 'Kansai Intl', city: 'Osaka', country: 'JP' },
  { code: 'ICN', name: 'Incheon Intl', city: 'Seoul', country: 'KR' },
  { code: 'PEK', name: 'Capital Intl', city: 'Beijing', country: 'CN' },
  { code: 'PVG', name: 'Pudong Intl', city: 'Shanghai', country: 'CN' },
  { code: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok', country: 'TH' },
  { code: 'HKT', name: 'Phuket Intl', city: 'Phuket', country: 'TH' },
  { code: 'KUL', name: 'Kuala Lumpur Intl', city: 'Kuala Lumpur', country: 'MY' },
  { code: 'MNL', name: 'Ninoy Aquino', city: 'Manila', country: 'PH' },
  { code: 'CGK', name: 'Soekarno-Hatta', city: 'Jakarta', country: 'ID' },
  { code: 'DPS', name: 'Ngurah Rai', city: 'Bali', country: 'ID' },
  { code: 'SGN', name: 'Tan Son Nhat', city: 'Ho Chi Minh City', country: 'VN' },
  { code: 'HAN', name: 'Noi Bai', city: 'Hanoi', country: 'VN' },
  { code: 'CMB', name: 'Bandaranaike', city: 'Colombo', country: 'LK' },
  { code: 'KTM', name: 'Tribhuvan', city: 'Kathmandu', country: 'NP' },
  { code: 'DEL', name: 'Indira Gandhi Intl', city: 'Delhi', country: 'IN' },
  { code: 'BOM', name: 'Chhatrapati Shivaji', city: 'Mumbai', country: 'IN' },
  { code: 'BLR', name: 'Kempegowda Intl', city: 'Bangalore', country: 'IN' },
  { code: 'MAA', name: 'Chennai Intl', city: 'Chennai', country: 'IN' },
  { code: 'HYD', name: 'Rajiv Gandhi Intl', city: 'Hyderabad', country: 'IN' },
  { code: 'MLE', name: 'Velana Intl', city: 'Male', country: 'MV' },
  // Oceania
  { code: 'SYD', name: 'Kingsford Smith', city: 'Sydney', country: 'AU' },
  { code: 'MEL', name: 'Melbourne Intl', city: 'Melbourne', country: 'AU' },
  { code: 'BNE', name: 'Brisbane Intl', city: 'Brisbane', country: 'AU' },
  { code: 'PER', name: 'Perth Intl', city: 'Perth', country: 'AU' },
  { code: 'AKL', name: 'Auckland Intl', city: 'Auckland', country: 'NZ' },
  // North America
  { code: 'JFK', name: 'John F. Kennedy', city: 'New York', country: 'US' },
  { code: 'LGA', name: 'LaGuardia', city: 'New York', country: 'US' },
  { code: 'EWR', name: 'Newark', city: 'New York', country: 'US' },
  { code: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles', country: 'US' },
  { code: 'SFO', name: 'San Francisco Intl', city: 'San Francisco', country: 'US' },
  { code: 'ORD', name: "O'Hare Intl", city: 'Chicago', country: 'US' },
  { code: 'MIA', name: 'Miami Intl', city: 'Miami', country: 'US' },
  { code: 'BOS', name: 'Logan Intl', city: 'Boston', country: 'US' },
  { code: 'ATL', name: 'Hartsfield-Jackson', city: 'Atlanta', country: 'US' },
  { code: 'DFW', name: 'Dallas Fort Worth', city: 'Dallas', country: 'US' },
  { code: 'DEN', name: 'Denver Intl', city: 'Denver', country: 'US' },
  { code: 'SEA', name: 'Seattle-Tacoma', city: 'Seattle', country: 'US' },
  { code: 'LAS', name: 'Harry Reid Intl', city: 'Las Vegas', country: 'US' },
  { code: 'PHX', name: 'Phoenix Sky Harbor', city: 'Phoenix', country: 'US' },
  { code: 'MCO', name: 'Orlando Intl', city: 'Orlando', country: 'US' },
  { code: 'IAD', name: 'Dulles Intl', city: 'Washington DC', country: 'US' },
  { code: 'IAH', name: 'George Bush', city: 'Houston', country: 'US' },
  { code: 'YYZ', name: 'Pearson Intl', city: 'Toronto', country: 'CA' },
  { code: 'YVR', name: 'Vancouver Intl', city: 'Vancouver', country: 'CA' },
  { code: 'YUL', name: 'Pierre Elliott Trudeau', city: 'Montreal', country: 'CA' },
  { code: 'YYC', name: 'Calgary Intl', city: 'Calgary', country: 'CA' },
  // Mexico & Caribbean
  { code: 'MEX', name: 'Benito Juarez Intl', city: 'Mexico City', country: 'MX' },
  { code: 'CUN', name: 'Cancun Intl', city: 'Cancun', country: 'MX' },
  { code: 'PUJ', name: 'Punta Cana', city: 'Punta Cana', country: 'DO' },
  { code: 'MBJ', name: 'Sangster Intl', city: 'Montego Bay', country: 'JM' },
  // South America
  { code: 'GRU', name: 'Guarulhos Intl', city: 'Sao Paulo', country: 'BR' },
  { code: 'GIG', name: 'Galeao Intl', city: 'Rio de Janeiro', country: 'BR' },
  { code: 'EZE', name: 'Ministro Pistarini', city: 'Buenos Aires', country: 'AR' },
  { code: 'SCL', name: 'Comodoro Arturo Merino', city: 'Santiago', country: 'CL' },
  { code: 'BOG', name: 'El Dorado', city: 'Bogota', country: 'CO' },
  { code: 'LIM', name: 'Jorge Chavez', city: 'Lima', country: 'PE' },
  // Africa
  { code: 'CPT', name: 'Cape Town Intl', city: 'Cape Town', country: 'ZA' },
  { code: 'JNB', name: 'OR Tambo Intl', city: 'Johannesburg', country: 'ZA' },
  { code: 'CAI', name: 'Cairo Intl', city: 'Cairo', country: 'EG' },
  { code: 'HRG', name: 'Hurghada Intl', city: 'Hurghada', country: 'EG' },
  { code: 'SSH', name: 'Sharm el-Sheikh', city: 'Sharm el-Sheikh', country: 'EG' },
  { code: 'CMN', name: 'Mohammed V Intl', city: 'Casablanca', country: 'MA' },
  { code: 'RAK', name: 'Menara', city: 'Marrakech', country: 'MA' },
  { code: 'AGA', name: 'Al Massira', city: 'Agadir', country: 'MA' },
  { code: 'TUN', name: 'Carthage Intl', city: 'Tunis', country: 'TN' },
  { code: 'DJE', name: 'Djerba-Zarzis', city: 'Djerba', country: 'TN' },
  { code: 'NBO', name: 'Jomo Kenyatta', city: 'Nairobi', country: 'KE' },
  { code: 'ZNZ', name: 'Abeid Amani Karume', city: 'Zanzibar', country: 'TZ' },
  { code: 'ADD', name: 'Bole Intl', city: 'Addis Ababa', country: 'ET' },
  { code: 'ACC', name: 'Kotoka Intl', city: 'Accra', country: 'GH' },
  { code: 'LOS', name: 'Murtala Muhammed', city: 'Lagos', country: 'NG' },
  { code: 'MRU', name: 'Sir Seewoosagur Ramgoolam', city: 'Mauritius', country: 'MU' },
]

function searchAirports(query) {
  if (!query || query.length < 1) return []
  const q = query.toLowerCase()
  return AIRPORTS.filter(a =>
    a.code.toLowerCase().includes(q) ||
    a.name.toLowerCase().includes(q) ||
    a.city.toLowerCase().includes(q) ||
    a.country.toLowerCase().includes(q)
  ).slice(0, 8)
}

function getAirportLabel(code) {
  const a = AIRPORTS.find(x => x.code === code)
  return a ? `${a.code} — ${a.city}` : code
}

function buildGoogleFlightsUrl(from, to, depDate, retDate, isReturn) {
  const dep = depDate.replace(/-/g, '')
  if (isReturn && retDate) {
    const ret = retDate.replace(/-/g, '')
    return `https://www.google.com/travel/flights?q=Flights+from+${from}+to+${to}+on+${dep}+returning+${ret}`
  }
  return `https://www.google.com/travel/flights?q=Flights+from+${from}+to+${to}+on+${dep}`
}

// ── Custom Calendar ───────────────────────────────────────────────────────────
function Calendar({ value, onChange, onClose, theme, isMobile }) {
  const t = THEMES[theme]
  const [viewDate, setViewDate] = useState(() => value ? new Date(value) : new Date())
  const today = new Date(); today.setHours(0,0,0,0)
  const selected = value ? new Date(value) : null

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']

  function prevMonth() { setViewDate(new Date(year, month - 1, 1)) }
  function nextMonth() { setViewDate(new Date(year, month + 1, 1)) }

  function selectDay(day) {
    const d = new Date(year, month, day)
    if (d < today) return
    onChange(`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`)
    onClose()
  }

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <>
    {isMobile && <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)' }} />}
    <div style={{
      position: isMobile ? 'fixed' : 'absolute', top: isMobile ? '50%' : '100%', left: isMobile ? '50%' : 0, transform: isMobile ? 'translate(-50%,-50%)' : 'none', zIndex: 2000, marginTop: isMobile ? 0 : 8,
      background: t.calBg, border: `1px solid ${t.border}`, borderRadius: 16,
      padding: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', minWidth: 280, width: isMobile ? 'min(340px,92vw)' : 320,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.muted, fontSize: 18, padding: '4px 8px', borderRadius: 8 }}>‹</button>
        <span style={{ color: t.text, fontWeight: 700, fontSize: 15 }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.muted, fontSize: 18, padding: '4px 8px', borderRadius: 8 }}>›</button>
      </div>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
        {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, color: t.muted, padding: '4px 0', fontWeight: 600 }}>{d}</div>)}
      </div>
      {/* Days */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const date = new Date(year, month, day)
          const isPast = date < today
          const isToday = date.getTime() === today.getTime()
          const isSel = selected && date.getTime() === selected.getTime()
          return (
            <button key={i} onClick={() => selectDay(day)} disabled={isPast}
              style={{
                background: isSel ? t.accent : isToday ? `${t.accent}22` : 'none',
                border: isToday && !isSel ? `1px solid ${t.accent}55` : '1px solid transparent',
                borderRadius: 8, color: isPast ? t.muted : isSel ? '#fff' : t.text,
                cursor: isPast ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: isSel ? 700 : 400,
                padding: '6px 0', opacity: isPast ? 0.35 : 1, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!isPast && !isSel) e.target.style.background = t.calHover }}
              onMouseLeave={e => { if (!isSel) e.target.style.background = 'none' }}
            >{day}</button>
          )
        })}
      </div>

    </div>
    </>
  )
}

// ── Date Picker Input ─────────────────────────────────────────────────────────
function DateInput({ label, value, onChange, theme, isMobile }) {
  const t = THEMES[theme]
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const display = value ? new Date(value + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select date'

  return (
    <div ref={ref} style={{ position: 'relative', flex: '1 1 140px' }}>
      <label style={{ color: t.muted, fontSize: 11, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</label>
      <button onClick={() => setOpen(!open)}
        style={{ width: '100%', background: t.input, border: `1px solid ${open ? t.accent + '88' : t.border}`, borderRadius: 10, color: value ? t.text : t.muted, fontSize: 14, fontWeight: 600, padding: '10px 14px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border 0.2s' }}>
        <span>📅 {display}</span>
        <span style={{ fontSize: 10, opacity: 0.5 }}>▼</span>
      </button>
      {open && <Calendar value={value} onChange={onChange} onClose={() => setOpen(false)} theme={theme} isMobile={isMobile} />}
    </div>
  )
}

// ── Airport Input ─────────────────────────────────────────────────────────────
function AirportInput({ label, value, onChange, theme, fullWidth }) {
  const t = THEMES[theme]
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState([])
  const [focused, setFocused] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const ref = useRef(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) { setFocused(false); setSuggestions([]) }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleChange(e) {
    const val = e.target.value
    setQuery(val); setSuggestions(searchAirports(val)); setFocused(true); setActiveIdx(-1)
    if (val.length === 3) {
      const exact = AIRPORTS.find(a => a.code.toLowerCase() === val.toLowerCase())
      if (exact) onChange(exact.code)
    }
  }

  function handleKeyDown(e) {
    if (!suggestions.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); handleSelect(suggestions[activeIdx]) }
    if (e.key === 'Escape') { setFocused(false); setSuggestions([]) }
  }

  function handleSelect(airport) {
    setQuery(`${airport.code} — ${airport.city}`)
    onChange(airport.code); setSuggestions([]); setFocused(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative', flex: fullWidth ? '1 1 100%' : '1 1 160px', width: fullWidth ? '100%' : undefined }}>
      <label style={{ color: t.muted, fontSize: 11, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</label>
      <input value={query} onChange={handleChange} onKeyDown={handleKeyDown}
        onFocus={() => { setFocused(true); if (query) setSuggestions(searchAirports(query)) }}
        placeholder="City or airport code..."
        style={{ width: '100%', background: t.input, border: `1px solid ${focused ? t.accent + '88' : t.border}`, borderRadius: 10, color: t.text, fontSize: 14, fontWeight: 600, padding: '10px 14px', transition: 'border 0.2s', outline: 'none' }}
      />
      {focused && suggestions.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: t.calBg, border: `1px solid ${t.border}`, borderRadius: 10, marginTop: 4, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          {suggestions.map((airport, idx) => (
            <div key={airport.code} onMouseDown={() => handleSelect(airport)}
              style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${t.border}`, background: idx === activeIdx ? t.calHover : 'transparent', transition: 'background 0.1s' }}
              onMouseEnter={() => setActiveIdx(idx)} onMouseLeave={() => setActiveIdx(-1)}>
              <div>
                <span style={{ color: t.accent, fontWeight: 700, fontSize: 14, marginRight: 8 }}>{airport.code}</span>
                <span style={{ color: t.text, fontSize: 13 }}>{airport.name}</span>
              </div>
              <span style={{ color: t.muted, fontSize: 12 }}>{airport.city}, {airport.country}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Alert Panel ───────────────────────────────────────────────────────────────
function AlertPanel({ from, to, theme }) {
  const t = THEMES[theme]
  const [email, setEmail] = useState('')
  const [alertType, setAlertType] = useState('price')
  const [targetPrice, setTargetPrice] = useState('')
  const [targetPercent, setTargetPercent] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  async function saveAlert() {
    if (!email || !email.includes('@')) { setError('Please enter a valid email'); return }
    if (alertType === 'price' && !targetPrice) { setError('Please enter a target price'); return }
    if (alertType === 'percent' && !targetPercent) { setError('Please enter a target %'); return }
    setSaving(true); setError(null)
    try {
      await axios.post(`${API}/alerts`, { from, to, email, alertType, targetPrice: parseFloat(targetPrice) || null, targetPercent: parseFloat(targetPercent) || null })
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch (e) { setError(e.response?.data?.error || 'Failed to save alert') }
    setSaving(false)
  }

  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20, marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 18 }}>🔔</span>
        <span style={{ color: t.text, fontWeight: 700, fontSize: 15 }}>Price Alert</span>
        <span style={{ color: t.muted, fontSize: 12 }}>{from} → {to}</span>
      </div>

      {/* Alert type tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[{ id: 'price', label: '£ Fixed Price' }, { id: 'percent', label: '% Drop' }, { id: 'both', label: 'Both' }].map(opt => (
          <button key={opt.id} onClick={() => setAlertType(opt.id)}
            style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: alertType === opt.id ? t.accentGrad : t.input, color: alertType === opt.id ? '#fff' : t.muted, transition: 'all 0.2s' }}>
            {opt.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        {(alertType === 'price' || alertType === 'both') && (
          <div style={{ flex: '1 1 120px' }}>
            <label style={{ color: t.muted, fontSize: 11, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Target Price (£)</label>
            <input type="number" value={targetPrice} onChange={e => setTargetPrice(e.target.value)} placeholder="e.g. 200"
              style={{ width: '100%', background: t.input, border: `1px solid ${t.border}`, borderRadius: 8, color: t.text, fontSize: 14, padding: '8px 12px', outline: 'none' }} />
          </div>
        )}
        {(alertType === 'percent' || alertType === 'both') && (
          <div style={{ flex: '1 1 120px' }}>
            <label style={{ color: t.muted, fontSize: 11, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Drop % Threshold</label>
            <input type="number" value={targetPercent} onChange={e => setTargetPercent(e.target.value)} placeholder="e.g. 10"
              style={{ width: '100%', background: t.input, border: `1px solid ${t.border}`, borderRadius: 8, color: t.text, fontSize: 14, padding: '8px 12px', outline: 'none' }} />
          </div>
        )}
        <div style={{ flex: '2 1 200px' }}>
          <label style={{ color: t.muted, fontSize: 11, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com"
            style={{ width: '100%', background: t.input, border: `1px solid ${t.border}`, borderRadius: 8, color: t.text, fontSize: 14, padding: '8px 12px', outline: 'none' }} />
        </div>
      </div>

      {error && <div style={{ color: t.danger, fontSize: 12, marginBottom: 8 }}>⚠️ {error}</div>}

      <button onClick={saveAlert} disabled={saving}
        style={{ background: saved ? t.success : t.accentGrad, border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, padding: '10px 20px', cursor: 'pointer', transition: 'all 0.2s' }}>
        {saved ? '✅ Alert Saved!' : saving ? '⏳ Saving...' : '🔔 Set Alert'}
      </button>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function PriceBadge({ current, min, max, theme }) {
  const t = THEMES[theme]
  if (!current || !min || !max || min === max) return null
  const pct = ((current - min) / (max - min)) * 100
  const color = pct < 30 ? t.success : pct < 65 ? t.warning : t.danger
  const label = pct < 30 ? 'GREAT DEAL' : pct < 65 ? 'AVERAGE' : 'EXPENSIVE'
  return <span style={{ color, fontSize: 11, fontWeight: 700, letterSpacing: 1, padding: '3px 10px', border: `1px solid ${color}44`, borderRadius: 20, background: `${color}11` }}>{label}</span>
}

function CustomTooltip({ active, payload, label, theme }) {
  const t = THEMES[theme]
  if (active && payload && payload.length) {
    return (
      <div style={{ background: t.tooltipBg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
        <p style={{ color: t.muted, fontSize: 11, margin: 0 }}>{label}</p>
        <p style={{ color: t.accent, fontSize: 18, fontWeight: 700, margin: '2px 0 0' }}>£{payload[0].value}</p>
      </div>
    )
  }
  return null
}

function RoutePill({ route, isSelected, onClick, onRemove, theme }) {
  const t = THEMES[theme]
  return (
    <div onClick={onClick} tabIndex={0} onKeyDown={e => e.key === 'Enter' && onClick()}
      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: isSelected ? t.pillActive : t.surface, border: `1px solid ${isSelected ? t.pillActiveBorder : t.border}`, borderRadius: 10, padding: '8px 12px', transition: 'all 0.2s', userSelect: 'none', outline: 'none' }}>
      <span style={{ color: t.text, fontWeight: 700, fontSize: 14 }}>{route.from}</span>
      <span style={{ color: t.accent, fontSize: 12 }}>{route.isReturn ? '⇄' : '→'}</span>
      <span style={{ color: t.text, fontWeight: 700, fontSize: 14 }}>{route.to}</span>
      {route.cheapest && <span style={{ color: t.accent, fontSize: 13, fontWeight: 700, marginLeft: 4 }}>£{route.cheapest}</span>}
      {route.isReturn && <span style={{ color: t.warning, fontSize: 10, padding: '1px 6px', background: `${t.warning}22`, borderRadius: 10 }}>RT</span>}
      <span onClick={e => { e.stopPropagation(); onRemove() }} style={{ color: t.danger, fontSize: 16, marginLeft: 4, lineHeight: 1, opacity: 0.6, cursor: 'pointer' }}>×</span>
    </div>
  )
}

function FlightCard({ flight: f, index: i, theme }) {
  const t = THEMES[theme]
  const airlineUrl = getAirlineUrl(f.airline)
  const [focused, setFocused] = useState(false)
  return (
    <div tabIndex={0} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      onKeyDown={e => { if (e.key === 'Enter' && airlineUrl) window.open(airlineUrl, '_blank') }}
      style={{ background: i === 0 ? `${t.accent}11` : t.card, border: `1px solid ${i === 0 ? t.accent + '33' : focused ? t.accent + '55' : t.cardBorder}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10, outline: 'none', transition: 'border 0.15s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ color: t.text, fontWeight: 700, fontSize: 15 }}>{getAirlineName(f.airline)}</span>
            <span style={{ color: t.muted, fontSize: 11 }}>({f.airline})</span>
            {i === 0 && <span style={{ color: t.success, fontSize: 10, fontWeight: 700, padding: '2px 8px', background: `${t.success}22`, borderRadius: 20 }}>CHEAPEST</span>}
          </div>
          <span style={{ color: t.muted, fontSize: 12 }}>
            {f.stops === 0 ? '✈️ Direct' : `🔄 ${f.stops} stop(s)`} · Dep {f.departure.slice(11, 16)} · Arr {f.arrival.slice(11, 16)}
          </span>
        </div>
        <div style={{ textAlign: 'right', marginLeft: 12 }}>
          <div style={{ color: i === 0 ? t.accent : t.text, fontSize: 20, fontWeight: 800, marginBottom: 6 }}>£{f.price}</div>
          {airlineUrl && (
            <a href={airlineUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-block', background: `${t.accent}18`, border: `1px solid ${t.accent}44`, borderRadius: 8, color: t.accent, padding: '4px 10px', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
              Book →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ activeTab, setActiveTab, routes, theme, onThemeToggle, isMobile }) {
  const t = THEMES[theme]
  const navItems = [
    { id: 'search', icon: '🔍', label: 'Search' },
    { id: 'tracked', icon: '📍', label: 'Tracked', badge: routes.length },
    { id: 'alerts', icon: '🔔', label: 'Alerts' },
    { id: 'history', icon: '📈', label: 'History' },
  ]
  return (
    <div style={{ width: 220, minHeight: '100vh', background: t.sidebar, borderRight: `1px solid ${t.sidebarBorder}`, display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: '0 16px 24px', borderBottom: `1px solid ${t.sidebarBorder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Plane icon */}
          <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="planeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00c6ff"/>
                <stop offset="100%" stopColor="#0072ff"/>
              </linearGradient>
            </defs>
            <g transform="translate(18,18) rotate(-10)">
              <ellipse cx="0" cy="0" rx="13" ry="3.5" fill="url(#planeGrad)"/>
              <path d="M13,0 Q18,-0.5 20,0 Q18,0.5 13,0Z" fill="url(#planeGrad)"/>
              <path d="M2,-3.5 Q6,-4 12,-13 Q14,-14 15,-12 Q11,-6 4,0Z" fill="url(#planeGrad)" opacity="0.9"/>
              <path d="M-8,-3.5 Q-6,-4 -3,-8 Q-2,-9 -1,-7 Q-3,-4 -7,0Z" fill="url(#planeGrad)" opacity="0.72"/>
              <path d="M-12,0 L-9,-5.5 L-7,-4 L-7,0Z" fill="url(#planeGrad)" opacity="0.65"/>
              <ellipse cx="7" cy="-5.5" rx="3.5" ry="1.5" fill="url(#planeGrad)" opacity="0.55"/>
            </g>
          </svg>
          {/* Text */}
          <div>
            <div style={{ lineHeight: 1 }}>
              <span style={{ fontSize: 16, fontWeight: 300, letterSpacing: 3, color: t.text, fontFamily: 'DM Sans, sans-serif' }}>FARE</span>
              <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: 2, background: 'linear-gradient(90deg,#00c6ff,#0072ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'DM Sans, sans-serif' }}>WATCH</span>
            </div>
            <div style={{ fontSize: 7, letterSpacing: 3, color: t.muted, opacity: 0.5, marginTop: 3, fontFamily: 'DM Sans, sans-serif' }}>FLIGHT PRICE TRACKER</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            tabIndex={0}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', marginBottom: 4, background: activeTab === item.id ? `${t.accent}18` : 'transparent', color: activeTab === item.id ? t.accent : t.muted, fontWeight: activeTab === item.id ? 700 : 400, fontSize: 14, transition: 'all 0.15s', textAlign: 'left' }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span>{item.label}</span>
            {item.badge > 0 && (
              <span style={{ marginLeft: 'auto', background: t.accent, color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20 }}>{item.badge}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Theme toggle */}
      <div style={{ padding: '16px 20px', borderTop: `1px solid ${t.sidebarBorder}` }}>
        <button onClick={onThemeToggle}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: `1px solid ${t.border}`, cursor: 'pointer', background: t.surface, color: t.text, fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }}>
          <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>

      
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [theme, setTheme] = useState('dark')
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  const [activeTab, setActiveTab] = useState('search')
  const [routes, setRoutes] = useState([])
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(null)
  const [from, setFrom] = useState('LHR')
  const [to, setTo] = useState('JFK')
  const [depDate, setDepDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0] })
  const [retDate, setRetDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 37); return d.toISOString().split('T')[0] })
  const [isReturn, setIsReturn] = useState(false)
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [directOnly, setDirectOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [chartDays, setChartDays] = useState(365)
  const [showAlertPanel, setShowAlertPanel] = useState(false)
  const [timeFilter, setTimeFilter] = useState('all')

  const TIME_SLOTS = [
    { id: 'all', label: 'All', icon: '🕐' },
    { id: 'early', label: 'Early', sub: '00–06', icon: '🌙' },
    { id: 'morning', label: 'Morning', sub: '06–12', icon: '🌅' },
    { id: 'afternoon', label: 'Afternoon', sub: '12–18', icon: '☀️' },
    { id: 'evening', label: 'Evening', sub: '18–24', icon: '🌆' },
  ]

  function filterByTime(flights) {
    if (timeFilter === 'all') return flights
    return flights.filter(f => {
      const hour = parseInt(f.departure.slice(11, 13))
      if (timeFilter === 'early') return hour >= 0 && hour < 6
      if (timeFilter === 'morning') return hour >= 6 && hour < 12
      if (timeFilter === 'afternoon') return hour >= 12 && hour < 18
      if (timeFilter === 'evening') return hour >= 18
      return true
    })
  }

  function buildBudgetLinks(from, to, date) {
    return [
      { name: 'easyJet', color: '#ff6600', url: `https://www.easyjet.com/en/cheap-flights/${from.toLowerCase()}-${to.toLowerCase()}` },
      { name: 'Ryanair', color: '#073590', url: `https://www.ryanair.com/gb/en/trip/flights/select?ADT=1&DateOut=${date}&Origin=${from}&Destination=${to}&isReturn=false` },
      { name: 'Wizz Air', color: '#c6007e', url: `https://wizzair.com/en-gb/flights/${from.toLowerCase()}/${to.toLowerCase()}/${date}` },
      { name: 'Jet2', color: '#e8002d', url: 'https://www.jet2.com/flights' },
      { name: 'British Airways', color: '#2b5c9e', url: 'https://www.britishairways.com/travel/flights' },
    ]
  }

  const t = THEMES[theme]
  const selectedRoute = selectedRouteIdx !== null ? routes[selectedRouteIdx] : null
  const history = selectedRoute?.history ?? []
  const filteredHistory = history.slice(-chartDays)
  const maxPrice = filteredHistory.length ? Math.max(...filteredHistory.map(h => h.price)) : 0

  async function search() {
    if (!from || !to || from === to) { setError('Please select different airports.'); return }
    setLoading(true); setError(null)
    try {
      const res = await axios.get(`${API}/flights/search`, { params: { from, to, date: depDate, adults, children } })
      let flights = res.data.flights
      if (directOnly) flights = flights.filter(f => f.stops === 0)
      let returnFlights = []; let returnCheapest = null
      if (isReturn) {
        const retRes = await axios.get(`${API}/flights/search`, { params: { from: to, to: from, date: retDate } })
        returnFlights = retRes.data.flights
        if (directOnly) returnFlights = returnFlights.filter(f => f.stops === 0)
        returnCheapest = retRes.data.cheapest
      }
      const roundTripPrice = isReturn && returnCheapest ? Math.round((res.data.cheapest + returnCheapest) * 100) / 100 : null
      const histRes = await axios.get(`${API}/flights/history`, { params: { from, to, days: 365 } })
      const newRoute = {
        from, to, depDate, retDate, isReturn, cheapest: res.data.cheapest, roundTripPrice,
        flights, returnFlights,
        history: histRes.data.history.map(h => ({ ...h, date: (h.date || h.fetched_at || "").slice(5, 16) })),
        lowest: histRes.data.lowest, lastUpdated: new Date().toLocaleTimeString(),
      }
      const existingIdx = routes.findIndex(r => r.from === from && r.to === to && r.isReturn === isReturn)
      if (existingIdx >= 0) {
        const updated = [...routes]; updated[existingIdx] = newRoute
        setRoutes(updated); setSelectedRouteIdx(existingIdx)
      } else {
        setRoutes(prev => [...prev, newRoute]); setSelectedRouteIdx(routes.length)
      }
      setActiveTab('search')
    } catch (e) { setError(e.response?.data?.error || 'Failed to fetch prices. Is the backend running?') }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: t.bg, fontFamily: "'DM Sans', sans-serif", color: t.text, transition: 'all 0.3s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=Space+Mono:wght@700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { font-family: inherit; } input { font-family: inherit; outline: none; }
        a { text-decoration: none; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${t.accent}33; border-radius: 4px; }
        *:focus-visible { outline: 2px solid ${t.accent}; outline-offset: 2px; border-radius: 6px; }
      `}</style>

      {/* Desktop sidebar — hidden on mobile */}
      {!isMobile && <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} routes={routes} theme={theme} onThemeToggle={() => setTheme(th => th === 'dark' ? 'light' : 'dark')} isMobile={isMobile} />}

      {/* Mobile top bar */}
      {isMobile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: t.sidebar, borderBottom: `1px solid ${t.sidebarBorder}`, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="28" height="28" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="mobPlane" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00c6ff"/>
                  <stop offset="100%" stopColor="#0072ff"/>
                </linearGradient>
              </defs>
              <g transform="translate(18,18) rotate(-10)">
                <ellipse cx="0" cy="0" rx="13" ry="3.5" fill="url(#mobPlane)"/>
                <path d="M13,0 Q18,-0.5 20,0 Q18,0.5 13,0Z" fill="url(#mobPlane)"/>
                <path d="M2,-3.5 Q6,-4 12,-13 Q14,-14 15,-12 Q11,-6 4,0Z" fill="url(#mobPlane)" opacity="0.9"/>
                <path d="M-8,-3.5 Q-6,-4 -3,-8 Q-2,-9 -1,-7 Q-3,-4 -7,0Z" fill="url(#mobPlane)" opacity="0.72"/>
                <path d="M-12,0 L-9,-5.5 L-7,-4 L-7,0Z" fill="url(#mobPlane)" opacity="0.65"/>
              </g>
            </svg>
            <span style={{ fontSize: 15, fontWeight: 300, letterSpacing: 2, color: t.text }}>FARE</span>
            <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: 1, background: 'linear-gradient(90deg,#00c6ff,#0072ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>WATCH</span>
          </div>
          <button onClick={() => setTheme(th => th === 'dark' ? 'light' : 'dark')}
            style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 20, padding: '5px 10px', fontSize: 14, cursor: 'pointer', color: t.text }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, padding: isMobile ? '72px 16px 80px' : 32, overflowY: 'auto', maxWidth: '100%' }}>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div>
            <h1 style={{ color: t.text, fontSize: isMobile ? 20 : 24, fontWeight: 800, marginBottom: isMobile ? 16 : 24 }}>Search Flights</h1>

            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
              {/* One-way / Return */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {/* Passenger selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: t.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Adults</span>
                    <button onClick={() => setAdults(a => Math.max(1, a - 1))} style={{ width: 28, height: 28, borderRadius: '50%', border: "1px solid #444", background: t.input, color: t.text, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                    <span style={{ color: t.text, fontWeight: 700, fontSize: 15, minWidth: 20, textAlign: 'center' }}>{adults}</span>
                    <button onClick={() => setAdults(a => Math.min(9, a + 1))} style={{ width: 28, height: 28, borderRadius: '50%', border: "1px solid #444", background: t.input, color: t.text, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: t.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Children</span>
                    <button onClick={() => setChildren(c => Math.max(0, c - 1))} style={{ width: 28, height: 28, borderRadius: '50%', border: "1px solid #444", background: t.input, color: t.text, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                    <span style={{ color: t.text, fontWeight: 700, fontSize: 15, minWidth: 20, textAlign: 'center' }}>{children}</span>
                    <button onClick={() => setChildren(c => Math.min(8, c + 1))} style={{ width: 28, height: 28, borderRadius: '50%', border: "1px solid #444", background: t.input, color: t.text, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                  {(adults > 1 || children > 0) && <span style={{ color: t.accent, fontSize: 12, fontWeight: 600 }}>?? {adults + children} passengers � prices shown per person</span>}
                </div>
                {['One-way', 'Return'].map(opt => (
                  <button key={opt} onClick={() => setIsReturn(opt === 'Return')}
                    style={{ padding: '7px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: (opt === 'Return') === isReturn ? t.accentGrad : t.input, color: (opt === 'Return') === isReturn ? '#fff' : t.muted }}>
                    {opt === 'Return' ? '⇄ Return' : '→ One-way'}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16, flexDirection: isMobile ? 'column' : 'row' }}>
                <AirportInput label="From" value={getAirportLabel(from)} onChange={setFrom} theme={theme} fullWidth={isMobile} />
                <AirportInput label="To" value={getAirportLabel(to)} onChange={setTo} theme={theme} fullWidth={isMobile} />
                <DateInput label="Depart" value={depDate} onChange={setDepDate} theme={theme} isMobile={isMobile} />
                {isReturn && <DateInput label="Return" value={retDate} onChange={setRetDate} theme={theme} isMobile={isMobile} />}
                <button onClick={search} disabled={loading}
                  style={{ background: loading ? t.muted : t.accentGrad, border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, padding: '12px 28px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', alignSelf: isMobile ? 'stretch' : 'flex-end', width: isMobile ? '100%' : 'auto' }}>
                  {loading ? '⏳ Searching...' : '🔍 Search'}
                </button>
              </div>

              {/* Direct Only */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div onClick={() => setDirectOnly(!directOnly)} tabIndex={0} onKeyDown={e => e.key === 'Enter' && setDirectOnly(!directOnly)}
                  style={{ width: 40, height: 22, borderRadius: 11, cursor: 'pointer', position: 'relative', background: directOnly ? t.accentGrad : t.input, transition: 'background 0.2s', border: `1px solid ${t.border}` }}>
                  <div style={{ position: 'absolute', top: 2, left: directOnly ? 20 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                </div>
                <span style={{ color: directOnly ? t.accent : t.muted, fontSize: 13, fontWeight: 600 }}>Direct flights only ✈️</span>
              </div>
            </div>

            {error && <div style={{ background: `${t.danger}18`, border: `1px solid ${t.danger}44`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: t.danger, fontSize: 13 }}>❌ {error}</div>}

            {/* Tracked route pills */}
            {routes.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: t.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Tracked Routes ({routes.length})</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {routes.map((r, i) => (
                    <RoutePill key={i} route={r} isSelected={selectedRouteIdx === i} theme={theme}
                      onClick={() => setSelectedRouteIdx(i)}
                      onRemove={() => { const updated = routes.filter((_, idx) => idx !== i); setRoutes(updated); setSelectedRouteIdx(updated.length > 0 ? 0 : null) }} />
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {selectedRoute && (
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ flex: '1 1 300px' }}>
                  {/* Round trip banner */}
                  {selectedRoute.isReturn && selectedRoute.roundTripPrice && (
                    <div style={{ background: `${t.accent}11`, border: `1px solid ${t.accent}44`, borderRadius: 14, padding: '14px 18px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: t.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Round Trip Total</div>
                        <div style={{ color: t.text, fontSize: 28, fontWeight: 800 }}>£{selectedRoute.roundTripPrice}</div>
                        <div style={{ color: t.muted, fontSize: 12, marginTop: 2 }}>{selectedRoute.depDate} → {selectedRoute.retDate}</div>
                      </div>
                      <a href={buildGoogleFlightsUrl(selectedRoute.from, selectedRoute.to, selectedRoute.depDate, selectedRoute.retDate, true)} target="_blank" rel="noopener noreferrer"
                        style={{ background: '#4285f422', border: '1px solid #4285f4', borderRadius: 10, color: '#4285f4', padding: '10px 16px', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        🔍 Google Flights
                      </a>
                    </div>
                  )}

                  {/* Outbound */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <h2 style={{ color: t.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {selectedRoute.isReturn ? '✈️ Outbound: ' : ''}{selectedRoute.from} → {selectedRoute.to} · {selectedRoute.depDate}
                    </h2>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {!selectedRoute.isReturn && (
                        <a href={buildGoogleFlightsUrl(selectedRoute.from, selectedRoute.to, selectedRoute.depDate, null, false)} target="_blank" rel="noopener noreferrer"
                          style={{ background: '#4285f422', border: '1px solid #4285f444', borderRadius: 8, color: '#4285f4', padding: '5px 10px', fontSize: 11, fontWeight: 600 }}>
                          🔍 Google Flights
                        </a>
                      )}
                      <button onClick={() => setShowAlertPanel(!showAlertPanel)}
                        style={{ background: showAlertPanel ? `${t.warning}22` : t.input, border: `1px solid ${showAlertPanel ? t.warning : t.border}`, borderRadius: 8, color: showAlertPanel ? t.warning : t.muted, padding: '5px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        🔔 Alert
                      </button>
                    </div>
                  </div>

                  {/* Time filter */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                    {TIME_SLOTS.map(slot => (
                      <button key={slot.id} onClick={() => setTimeFilter(slot.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: timeFilter === slot.id ? t.accentGrad : t.input, color: timeFilter === slot.id ? '#fff' : t.muted }}>
                        <span>{slot.icon}</span>
                        <span>{slot.label}</span>
                        {slot.sub && <span style={{ opacity: 0.7, fontSize: 10 }}>{slot.sub}</span>}
                      </button>
                    ))}
                  </div>

                  {/* Cheapest price summary */}
                  {selectedRoute.flights.length > 0 && (
                    <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                      <div style={{ flex: 1, background: `${t.success}11`, border: `1px solid ${t.success}33`, borderRadius: 12, padding: '10px 14px' }}>
                        <div style={{ color: t.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>✈️ Cheapest Outbound</div>
                        <div style={{ color: t.success, fontSize: 20, fontWeight: 800 }}>£{Math.min(...selectedRoute.flights.map(f => f.price))}</div>
                        <div style={{ color: t.muted, fontSize: 11 }}>{getAirlineName(selectedRoute.flights.reduce((a, b) => a.price < b.price ? a : b).airline)}</div>
                      </div>
                      {selectedRoute.isReturn && selectedRoute.returnFlights.length > 0 && (
                        <div style={{ flex: 1, background: `${t.accent}11`, border: `1px solid ${t.accent}33`, borderRadius: 12, padding: '10px 14px' }}>
                          <div style={{ color: t.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>🔄 Cheapest Return</div>
                          <div style={{ color: t.accent, fontSize: 20, fontWeight: 800 }}>£{Math.min(...selectedRoute.returnFlights.map(f => f.price))}</div>
                          <div style={{ color: t.muted, fontSize: 11 }}>{getAirlineName(selectedRoute.returnFlights.reduce((a, b) => a.price < b.price ? a : b).airline)}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Outbound flights */}
                  {filterByTime(selectedRoute.flights).length === 0 ? (
                    <div style={{ background: `${t.danger}11`, border: `1px solid ${t.danger}33`, borderRadius: 12, padding: 16, color: t.danger, fontSize: 13 }}>No flights for this time slot. Try a different time filter.</div>
                  ) : filterByTime(selectedRoute.flights).map((f, i) => <FlightCard key={i} flight={f} index={i} theme={theme} />)}

                  {/* Return flights */}
                  {selectedRoute.isReturn && selectedRoute.returnFlights.length > 0 && (
                    <>
                      <h2 style={{ color: t.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, margin: '20px 0 10px' }}>
                        🔄 Return: {selectedRoute.to} → {selectedRoute.from} · {selectedRoute.retDate}
                      </h2>
                      {filterByTime(selectedRoute.returnFlights).length === 0 ? (
                        <div style={{ background: `${t.danger}11`, border: `1px solid ${t.danger}33`, borderRadius: 12, padding: 16, color: t.danger, fontSize: 13 }}>No return flights for this time slot.</div>
                      ) : filterByTime(selectedRoute.returnFlights).map((f, i) => <FlightCard key={i} flight={f} index={i} theme={theme} />)}
                    </>
                  )}

                  {/* Budget airlines section */}
                  <div style={{ marginTop: 20, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 16 }}>
                    <div style={{ color: t.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>🔍 Also check these airlines</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {buildBudgetLinks(selectedRoute.from, selectedRoute.to, selectedRoute.depDate).map(airline => (
                        <a key={airline.name} href={airline.url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: `1px solid ${airline.color}44`, background: `${airline.color}11`, color: airline.color, textDecoration: 'none', transition: 'all 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.background = `${airline.color}22`}
                          onMouseLeave={e => e.currentTarget.style.background = `${airline.color}11`}>
                          {airline.name} →
                        </a>
                      ))}
                    </div>
                    <p style={{ color: t.muted, fontSize: 11, marginTop: 10, opacity: 0.7 }}>
                      ⚠️ Prices shown are from Amadeus GDS and may differ from airline websites. Budget carriers like Ryanair and easyJet sell direct — always check their sites for the best fare.
                    </p>
                  </div>

                  {/* Alert panel */}
                  {showAlertPanel && <AlertPanel from={selectedRoute.from} to={selectedRoute.to} theme={theme} />}
                </div>

                {/* Chart */}
                <div style={{ flex: '2 1 400px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h2 style={{ color: t.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Price History · {selectedRoute.from} → {selectedRoute.to}</h2>
                    <PriceBadge current={selectedRoute.cheapest} min={selectedRoute.lowest} max={maxPrice} theme={theme} />
                  </div>
                  {filteredHistory.length === 0 ? (
                    <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 16, padding: 40, textAlign: 'center', color: t.muted }}>
                      <div style={{ fontSize: 32, marginBottom: 12 }}>📈</div>
                      <p>No history yet. Prices are saved on every search!</p>
                    </div>
                  ) : (
                    <div style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 16, padding: '20px 16px 12px' }}>
                      {/* Time range */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 16, justifyContent: 'flex-end' }}>
                        {[{ label: '7D', days: 7 }, { label: '30D', days: 30 }, { label: '90D', days: 90 }, { label: '1Y', days: 365 }].map(t2 => (
                          <button key={t2.label} onClick={() => setChartDays(t2.days)} tabIndex={0}
                            style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: chartDays === t2.days ? t.accentGrad : t.input, color: chartDays === t2.days ? '#fff' : t.muted }}>
                            {t2.label}
                          </button>
                        ))}
                      </div>
                      {/* Stats */}
                      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                        {[
                          { label: 'Current', value: `£${selectedRoute.cheapest}`, color: t.text },
                          { label: 'Lowest ever', value: `£${selectedRoute.lowest ?? Math.min(...filteredHistory.map(h => h.price))}`, color: t.success },
                          { label: 'Highest', value: `£${maxPrice}`, color: t.danger },
                          { label: 'Data points', value: filteredHistory.length, color: t.warning },
                        ].map(s => (
                          <div key={s.label} style={{ flex: '1 1 80px', background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 12px' }}>
                            <div style={{ color: t.muted, fontSize: 10, marginBottom: 3, textTransform: 'uppercase' }}>{s.label}</div>
                            <div style={{ color: s.color, fontSize: 16, fontWeight: 700 }}>{s.value}</div>
                          </div>
                        ))}
                      </div>
                      <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={filteredHistory} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} vertical={false} />
                          <XAxis dataKey="date" tick={{ fill: t.muted, fontSize: 10 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fill: t.muted, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `£${v}`} domain={['auto', 'auto']} />
                          <Tooltip content={<CustomTooltip theme={theme} />} />
                          {selectedRoute.lowest && <ReferenceLine y={selectedRoute.lowest} stroke={`${t.success}88`} strokeDasharray="4 3" label={{ value: 'Best', fill: t.success, fontSize: 10, position: 'right' }} />}
                          <Line type="monotone" dataKey="price" stroke={t.accent} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: t.accent, strokeWidth: 0 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}

            {routes.length === 0 && !loading && (
              <div style={{ textAlign: 'center', marginTop: 60, color: t.muted }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>✈️</div>
                <p style={{ fontSize: 20, fontWeight: 800, color: t.text, marginBottom: 8 }}>Start tracking flight prices</p>
                <p style={{ fontSize: 14, opacity: 0.7 }}>Search a route above to see live prices and track changes over time</p>
              </div>
            )}
          </div>
        )}

        {/* Tracked Tab */}
        {activeTab === 'tracked' && (
          <div>
            <h1 style={{ color: t.text, fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Tracked Routes</h1>
            {routes.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: 60, color: t.muted }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📍</div>
                <p>No routes tracked yet. Search for a flight to start tracking!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {routes.map((r, i) => (
                  <div key={i} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ color: t.text, fontWeight: 800, fontSize: 18 }}>{r.from}</span>
                        <span style={{ color: t.accent }}>{r.isReturn ? '⇄' : '→'}</span>
                        <span style={{ color: t.text, fontWeight: 800, fontSize: 18 }}>{r.to}</span>
                        {r.isReturn && <span style={{ color: t.warning, fontSize: 11, padding: '2px 8px', background: `${t.warning}22`, borderRadius: 10 }}>Return</span>}
                      </div>
                      <span style={{ color: t.muted, fontSize: 13 }}>Last updated: {r.lastUpdated} · {r.depDate}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ color: t.accent, fontSize: 24, fontWeight: 800 }}>£{r.cheapest}</span>
                      <button onClick={() => { setSelectedRouteIdx(i); setActiveTab('search') }}
                        style={{ background: t.accentGrad, border: 'none', borderRadius: 8, color: '#fff', padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>View →</button>
                      <button onClick={() => { const updated = routes.filter((_, idx) => idx !== i); setRoutes(updated); setSelectedRouteIdx(null) }}
                        style={{ background: `${t.danger}22`, border: `1px solid ${t.danger}44`, borderRadius: 8, color: t.danger, padding: '8px 12px', fontSize: 12, cursor: 'pointer' }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div>
            <h1 style={{ color: t.text, fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Price Alerts</h1>
            <p style={{ color: t.muted, fontSize: 14, marginBottom: 24 }}>Get notified by email when prices drop. Requires Gmail credentials in your backend .env file.</p>
            {routes.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: 60, color: t.muted }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
                <p>Search for a route first to set up alerts.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {routes.map((r, i) => <AlertPanel key={i} from={r.from} to={r.to} theme={theme} />)}
              </div>
            )}

            <div style={{ background: `${t.warning}11`, border: `1px solid ${t.warning}44`, borderRadius: 14, padding: 20, marginTop: 24 }}>
              <h3 style={{ color: t.warning, marginBottom: 8 }}>⚙️ Email Setup Required</h3>
              <p style={{ color: t.muted, fontSize: 13, lineHeight: 1.6 }}>
                To receive email alerts, add these to your backend <code style={{ background: t.input, padding: '2px 6px', borderRadius: 4 }}>.env</code> file:
              </p>
              <pre style={{ background: t.input, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, marginTop: 8, fontSize: 12, color: t.text, fontFamily: 'monospace' }}>
{`EMAIL_USER=your@gmail.com
EMAIL_PASS=your-app-password`}
              </pre>
              <p style={{ color: t.muted, fontSize: 12, marginTop: 8 }}>Use a Gmail App Password (not your regular password). Create one at myaccount.google.com/apppasswords</p>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div>
            <h1 style={{ color: t.text, fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Price History</h1>
            {routes.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: 60, color: t.muted }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📈</div>
                <p>No data yet. Start searching to build price history!</p>
              </div>
            ) : routes.map((r, i) => (
              <div key={i} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ color: t.text, fontSize: 16, fontWeight: 700 }}>{r.from} → {r.to}</h2>
                  <span style={{ color: t.accent, fontSize: 18, fontWeight: 800 }}>£{r.cheapest}</span>
                </div>
                {r.history.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={r.history} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: t.muted, fontSize: 9 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: t.muted, fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `£${v}`} domain={['auto', 'auto']} />
                      <Tooltip content={<CustomTooltip theme={theme} />} />
                      <Line type="monotone" dataKey="price" stroke={t.accent} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: t.accent }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ color: t.muted, fontSize: 13 }}>No history data yet for this route.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      
    {/* Mobile bottom tab bar */}
      {isMobile && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: t.sidebar, borderTop: `1px solid ${t.sidebarBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '8px 0 12px' }}>
          {[
            { id: 'search', icon: '🔍', label: 'Search' },
            { id: 'tracked', icon: '📍', label: 'Tracked', badge: routes.length },
            { id: 'alerts', icon: '🔔', label: 'Alerts' },
            { id: 'history', icon: '📈', label: 'History' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 16px', position: 'relative', minWidth: 60 }}>
              {item.badge > 0 && (
                <div style={{ position: 'absolute', top: 0, right: 10, background: t.accent, color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 10 }}>{item.badge}</div>
              )}
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span style={{ fontSize: 10, fontWeight: activeTab === item.id ? 700 : 400, color: activeTab === item.id ? t.accent : t.muted, letterSpacing: 0.5 }}>{item.label}</span>
              {activeTab === item.id && <div style={{ position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)', width: 20, height: 2, background: t.accent, borderRadius: 2 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// force rebuild





