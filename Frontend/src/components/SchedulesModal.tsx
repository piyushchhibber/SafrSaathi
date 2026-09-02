import React, { useState } from 'react';
import { RouteSchedule } from '../types';

interface SchedulesModalProps {
  schedules: RouteSchedule[];
  onClose: () => void;
  onBookRoute: (schedule: RouteSchedule) => void;
}

export const SchedulesModal: React.FC<SchedulesModalProps> = ({ schedules, onClose, onBookRoute }) => {
  const [filterFrom, setFilterFrom] = useState('');
  const [filterType, setFilterType] = useState('All');

  const filtered = schedules.filter((s) => {
    const matchQuery = s.from.toLowerCase().includes(filterFrom.toLowerCase()) || 
                       s.to.toLowerCase().includes(filterFrom.toLowerCase()) ||
                       s.routeNumber.toLowerCase().includes(filterFrom.toLowerCase());
    const matchType = filterType === 'All' || s.busType === filterType;
    return matchQuery && matchType;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-[#c6c5d4] flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-[#eae8e7] flex justify-between items-center bg-[#fbf9f8]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#000666] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-base">directions_bus</span>
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#1b1c1c]">PRTC Timetable & Routes</h3>
              <p className="text-xs text-[#454652]">Real-time bus timings and seat availability</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f0eded] hover:bg-[#eae8e7] flex items-center justify-center text-[#454652]"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Search / Filters */}
        <div className="p-4 border-b border-[#eae8e7] bg-[#f5f3f3] flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <input
              type="text"
              placeholder="Search origin, destination (e.g. Patiala, Chandigarh)..."
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="w-full bg-white border border-[#c6c5d4] rounded-xl pl-9 pr-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
            />
            <span className="material-symbols-outlined text-sm text-[#767683] absolute left-3 top-2.5">
              search
            </span>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs font-semibold text-[#1b1c1c] focus:outline-none"
          >
            <option value="All">All Bus Classes</option>
            <option value="HVAC">HVAC AC</option>
            <option value="Integral Coach">Integral Coach</option>
            <option value="Express">Express</option>
            <option value="Ordinary">Ordinary</option>
          </select>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-4 space-y-3 flex-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-[#767683]">
              <span className="material-symbols-outlined text-4xl text-[#c6c5d4] mb-2">search_off</span>
              <p className="font-semibold text-sm">No scheduled routes match your query.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.routeNumber}
                className="border border-[#c6c5d4] rounded-2xl p-4 hover:border-[#000666] transition flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#000666] bg-[#f0eded] px-2 py-0.5 rounded">
                      {item.routeNumber}
                    </span>
                    <span className="text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded">
                      {item.busType}
                    </span>
                    <span className="text-[11px] text-[#767683]">{item.frequency}</span>
                  </div>

                  <div className="font-bold text-sm text-[#1b1c1c] flex items-center gap-2">
                    <span>{item.from}</span>
                    <span className="material-symbols-outlined text-xs text-[#767683]">arrow_forward</span>
                    <span>{item.to}</span>
                  </div>

                  <div className="text-xs text-[#454652] flex items-center gap-3">
                    <span>Departure: <b>{item.departureTime}</b></span>
                    <span>Arrival: <b>{item.arrivalTime}</b></span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-base font-extrabold text-[#000666]">₹{item.fare}</div>
                    <div className="text-[10px] text-green-700 font-semibold">{item.availableSeats} seats left</div>
                  </div>
                  <button
                    onClick={() => onBookRoute(item)}
                    className="bg-[#000666] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#1a237e] transition shadow-xs"
                  >
                    Select & Book
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
