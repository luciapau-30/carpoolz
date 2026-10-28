// Generic yes/cancel confirmation dialog.
export default function ConfirmModal({ modal, setModal }) {
  return (
    <div className="modal-ov" onClick={() => setModal(null)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Confirm</h3>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{modal.msg}</p>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button className="btn b-red bs" onClick={e => { e.stopPropagation(); modal.onOk(); }}>Yes, do it</button>
          <button className="btn b-ghost bs" onClick={e => { e.stopPropagation(); setModal(null); }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
