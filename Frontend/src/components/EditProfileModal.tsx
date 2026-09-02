import React, { useEffect, useState } from 'react';
import { UserProfile, College } from '../types';
import { defaultStudentProfile } from '../data/mockData';

interface EditProfileModalProps {
  userProfile?: UserProfile;
  profile?: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updated: UserProfile) => void;
  onSaveProfile?: (updated: UserProfile) => void;
  colleges?: College[];
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  userProfile,
  profile,
  isOpen,
  onClose,
  onSave,
  onSaveProfile,
  colleges = [],
}) => {
  const currentProfile = userProfile || profile || defaultStudentProfile;

  const [name, setName] = useState(currentProfile?.name || 'Navjot Singh Dhillon');
  const [email, setEmail] = useState(currentProfile?.email || 'navjot.dhillon@thapar.edu');
  const [phone, setPhone] = useState(currentProfile?.phone || '+91 98145 67210');
  const [avatarUrl, setAvatarUrl] = useState(
    currentProfile?.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80'
  );
  const [fatherName, setFatherName] = useState(currentProfile?.fatherName || '');
  const [rollNo, setRollNo] = useState(currentProfile?.rollNo || '');
  const [college, setCollege] = useState(currentProfile?.college || currentProfile?.institution || colleges[0]?.name || '');
  const [address, setAddress] = useState(currentProfile?.permanentAddress || '');
  const [companyName, setCompanyName] = useState(currentProfile?.companyName || '');
  const [designation, setDesignation] = useState(currentProfile?.designation || '');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Sync state if modal reopens or profile updates
  useEffect(() => {
    if (isOpen && currentProfile) {
      setName(currentProfile.name || '');
      setEmail(currentProfile.email || '');
      setPhone(currentProfile.phone || '');
      setAvatarUrl(currentProfile.avatarUrl || '');
      setFatherName(currentProfile.fatherName || '');
      setRollNo(currentProfile.rollNo || '');
      setCollege(currentProfile.college || currentProfile.institution || colleges[0]?.name || '');
      setAddress(currentProfile.permanentAddress || '');
      setCompanyName(currentProfile.companyName || '');
      setDesignation(currentProfile.designation || '');
      setUploadedFileName('');
      setShowUrlInput(false);
    }
  }, [isOpen, currentProfile, colleges]);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, WEBP, etc.)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarUrl(event.target.result as string);
        setUploadedFileName(`${file.name} (${(file.size / 1024).toFixed(0)} KB)`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...currentProfile,
      name,
      email,
      phone,
      avatarUrl,
      fatherName: currentProfile.roleType === 'student' ? fatherName : currentProfile.fatherName,
      rollNo: currentProfile.roleType === 'student' ? rollNo : currentProfile.rollNo,
      college: currentProfile.roleType === 'student' ? college : currentProfile.college,
      permanentAddress: currentProfile.roleType === 'student' ? address : currentProfile.permanentAddress,
      companyName: currentProfile.roleType === 'corporate' ? companyName : currentProfile.companyName,
      designation: currentProfile.roleType === 'corporate' ? designation : currentProfile.designation,
      institution: currentProfile.roleType === 'corporate' ? companyName : (currentProfile.roleType === 'student' ? college : currentProfile.institution),
    };

    if (onSaveProfile) {
      onSaveProfile(updated);
    } else if (onSave) {
      onSave(updated);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full my-auto overflow-hidden shadow-2xl border border-[#c6c5d4] animate-in zoom-in-95">
        <div className="bg-[#000666] text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-2xl">manage_accounts</span>
            <div>
              <h3 className="font-bold text-base">Edit User Profile</h3>
              <p className="text-xs text-[#bdc2ff] capitalize">{currentProfile?.roleType ? currentProfile.roleType.replace('_', ' ') : 'User'} Account • {currentProfile?.passId || currentProfile?.adminId || 'PRTC-ACC'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto bg-[#fbf9f8]">
          {/* Profile Picture Upload Section */}
          <div className="bg-white border border-[#c6c5d4] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-[#1b1c1c] uppercase tracking-wider">
                Profile Photograph
              </label>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-[11px] font-bold text-[#000666] hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-xs">
                  {showUrlInput ? 'upload_file' : 'link'}
                </span>
                {showUrlInput ? 'Switch to File Upload' : 'Enter URL instead'}
              </button>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-xl border-2 border-dashed transition ${
                isDragging
                  ? 'border-[#000666] bg-blue-50/50'
                  : 'border-[#c6c5d4] bg-[#fbf9f8]'
              }`}
            >
              {/* Photo Preview */}
              <div className="relative group shrink-0">
                <img
                  src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                  alt="Profile"
                  className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl object-cover border-2 border-white shadow-md"
                />
                <label className="absolute inset-0 bg-black/40 text-white rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                  <span className="material-symbols-outlined text-xl">add_a_photo</span>
                  <span className="text-[9px] font-bold mt-0.5">Change</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Upload Controls & Actions */}
              <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                <div>
                  <h4 className="text-xs font-bold text-[#1b1c1c]">
                    Upload New Avatar Photo
                  </h4>
                  <p className="text-[11px] text-[#767683] mt-0.5">
                    Drag and drop your image here, or browse your device (JPG, PNG, WEBP)
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#000666] text-white text-xs font-bold hover:bg-[#1a237e] transition shadow-xs">
                    <span className="material-symbols-outlined text-sm">folder_open</span>
                    <span>Browse Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80');
                        setUploadedFileName('');
                      }}
                      className="px-2.5 py-1.5 rounded-xl border border-[#c6c5d4] text-xs font-semibold text-[#767683] hover:text-red-600 hover:border-red-300 transition flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">refresh</span>
                      Reset Default
                    </button>
                  )}
                </div>

                {uploadedFileName && (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg w-fit mx-auto sm:mx-0">
                    <span className="material-symbols-outlined text-xs">check_circle</span>
                    <span className="truncate max-w-[200px]">{uploadedFileName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Direct URL field */}
            {showUrlInput && (
              <div className="pt-2 animate-in fade-in">
                <label className="block text-[11px] font-bold text-[#1b1c1c] mb-1">
                  Or paste direct image URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => {
                    setAvatarUrl(e.target.value);
                    setUploadedFileName('');
                  }}
                  className="w-full bg-[#fbf9f8] border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                required
              />
            </div>
          </div>

          {currentProfile?.roleType === 'student' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Father's Name</label>
                  <input
                    type="text"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1">College / University</label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Permanent Punjab Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                />
              </div>
            </>
          )}

          {currentProfile?.roleType === 'corporate' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1b1c1c] mb-1">Designation</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-xs text-[#1b1c1c] focus:outline-none focus:border-[#000666]"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#c6c5d4] text-xs font-bold text-[#454652] hover:bg-[#eae8e7] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#000666] text-white text-xs font-bold hover:bg-[#1a237e] transition shadow-md"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
