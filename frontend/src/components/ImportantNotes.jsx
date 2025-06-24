import { useLocation, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import jsPDF from "jspdf";
import Sidebar from "../components/Sidebar";
import "./ImportantNotes.css";

export default function ImportantNotes() {
  const location = useLocation();
  const navigate = useNavigate();

  const { notes = "", noteSetId = null, loading, error } = location.state || {};
  const isEditing = !!noteSetId;

  const [collapsed, setCollapsed] = useState(false);
  const [editableNotes, setEditableNotes] = useState(notes);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");

  const pdfRef = useRef();

  const toggleSidebar = () => setCollapsed(!collapsed);

  const exportPDF = () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const marginLeft = 10;
    const marginTop = 10;
    const maxWidth = 180;
    const lineHeight = 10;

    const lines = pdf.splitTextToSize(editableNotes, maxWidth);
    let y = marginTop;

    lines.forEach((line) => {
      if (y + lineHeight > pdf.internal.pageSize.getHeight() - 10) {
        pdf.addPage();
        y = marginTop;
      }
      pdf.text(line, marginLeft, y);
      y += lineHeight;
    });

    pdf.save("important_notes.pdf");
  };

  const saveNotes = () => {
    if (!isEditing) {
      setShowTitleModal(true);
    } else {
      saveToLocalStorage(noteSetId, null); // update existing
    }
  };

  const saveToLocalStorage = (id, titleInput) => {
    const allNotes = JSON.parse(localStorage.getItem("notesData") || "{}");
    const idToUse = id || `notes_${Date.now()}`;
    const existingNote = allNotes[idToUse];

    allNotes[idToUse] = {
      ...existingNote,
      notes: editableNotes,
      title: isEditing ? existingNote?.title : titleInput.trim(),
      file_id: existingNote?.file_id || idToUse,
      created_at: existingNote?.created_at || new Date().toISOString(),
      modified_at: isEditing ? new Date().toISOString() : null,
    };

    localStorage.setItem("notesData", JSON.stringify(allNotes));
    alert(isEditing ? "✏️ Notes updated!" : "✅ Notes saved to library!");
    setShowTitleModal(false);
    navigate("/library");
  };

  const handleModalSave = () => {
    if (!noteTitle.trim()) {
      alert("❗ Please enter a title.");
      return;
    }
    saveToLocalStorage(null, noteTitle);
  };

  if (loading) return <p className="loading">⚙️ Generating notes, please wait...</p>;
  if (error) return <p className="error">❌ Error: {error}</p>;

  return (
    <div className="layout">
      <Sidebar collapsed={collapsed} toggleSidebar={toggleSidebar} />
      <main className="main-content">
        <header className="notes-header">
          <div className="header-spacer" />
        </header>

        <h2 className="page-subtitle">Important Notes</h2>

        <section ref={pdfRef} className="notepad-section">
          <textarea
            className="notepad"
            value={editableNotes}
            onChange={(e) => setEditableNotes(e.target.value)}
            placeholder="Generated notes will appear here..."
          />
        </section>

        <div className="note-actions">
          <button onClick={exportPDF}>📄 Export PDF</button>
          <button onClick={saveNotes}>💾 Save Notes</button>
        </div>

        {showTitleModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Name Your Notes</h3>
              <input
                type="text"
                placeholder="Enter notes title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
              />
              <div className="modal-buttons">
                <button className="cancel-btn" onClick={() => setShowTitleModal(false)}>Cancel</button>
                <button className="save-btn" onClick={handleModalSave}>Save</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
