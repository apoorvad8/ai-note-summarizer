import { useState, useEffect } from "react";
import { getNotes, createNote, deleteNote, summarizeNote } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [summarizingId, setSummarizingId] = useState(null);
  const [error, setError] = useState("");
  const { user, logoutUser } = useAuth();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await getNotes();
      setNotes(res.data);
    } catch {
      setError("Failed to load notes");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    try {
      const res = await createNote(title, content);
      setNotes([res.data, ...notes]);
      setTitle("");
      setContent("");
    } catch {
      setError("Failed to create note");
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async (id) => {
    setSummarizingId(id);
    try {
      const res = await summarizeNote(id);
      setNotes(notes.map((n) => (n.id === id ? res.data : n)));
    } catch {
      setError("Summarization failed. Check your OpenAI key.");
    } finally {
      setSummarizingId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNote(id);
      setNotes(notes.filter((n) => n.id !== id));
    } catch {
      setError("Failed to delete note");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-indigo-600">NoteAI</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.email}</span>
          <button
            onClick={logoutUser}
            className="text-sm text-gray-500 hover:text-gray-800 transition"
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
            {error}
            <button onClick={() => setError("")} className="ml-2 font-bold">×</button>
          </div>
        )}

        {/* Create note form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-base font-medium text-gray-700 mb-4">New note</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note here..."
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save note"}
            </button>
          </form>
        </div>

        {/* Notes list */}
        <h2 className="text-base font-medium text-gray-700 mb-4">
          Your notes ({notes.length})
        </h2>

        {notes.length === 0 && (
          <div className="text-center text-gray-400 py-16 text-sm">
            No notes yet. Create your first one above.
          </div>
        )}

        <div className="space-y-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-800">{note.title}</h3>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="text-gray-300 hover:text-red-400 text-lg leading-none transition"
                >
                  ×
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-4 whitespace-pre-wrap">
                {note.content}
              </p>

              {/* Summary block */}
              {note.summary ? (
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3">
                  <p className="text-xs font-medium text-indigo-400 mb-1">AI Summary</p>
                  <p className="text-sm text-indigo-800">{note.summary}</p>
                </div>
              ) : (
                <button
                  onClick={() => handleSummarize(note.id)}
                  disabled={summarizingId === note.id}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition disabled:opacity-50"
                >
                  {summarizingId === note.id
                    ? "Summarizing..."
                    : "Summarize with AI"}
                </button>
              )}

              <p className="text-xs text-gray-300 mt-3">
                {new Date(note.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}