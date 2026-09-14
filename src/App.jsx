import { useState, useEffect, useRef } from "react"
import { supabase } from "./supabaseClient"

function App() {
  const [seccion, setSeccion] = useState("home")

  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [adminUser, setAdminUser] = useState(null)
  const [adminMessage, setAdminMessage] = useState("")
  const [submissions, setSubmissions] = useState([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)

  const [publicSubmissions, setPublicSubmissions] = useState([])
  const [loadingPublicSubmissions, setLoadingPublicSubmissions] = useState(false)

  const [letrasGlitch, setLetrasGlitch] = useState({})
  const [volumen, setVolumen] = useState(0.3)

  const [submission, setSubmission] = useState({
    title: "",
    story: "",
    location: "",
    date: "",
    category: "Case",
    author_name: "",
  })

  const [sendingSubmission, setSendingSubmission] = useState(false)
  const [submissionMessage, setSubmissionMessage] = useState("")

  const musicaPorSeccion = {
    home: "/Audio/Home.mp3",
    cases: "/Audio/Cases.mp3",
    entities: "/Audio/Entities.mp3",
    locations: "/Audio/Locations.mp3",
    incidents: "/Audio/Incidents.mp3",
    submit: "/Audio/Home.mp3",
    admin: "/Audio/Home.mp3",
  }

  const [archivoAbierto, setArchivoAbierto] = useState(false)
  const [audioAbierto, setAudioAbierto] = useState(false)
  const [audioReproduciendo, setAudioReproduciendo] = useState(false)
  const [imagenAbierta, setImagenAbierta] = useState(false)
  const [entidadAbierta, setEntidadAbierta] = useState(null)
  const [ubicacionAbierta, setUbicacionAbierta] = useState(null)
  const [incidenteAbierto, setIncidenteAbierto] = useState(null)
  const [mostrarArchivoBloqueado, setMostrarArchivoBloqueado] = useState(false)
  const [mostrarCaseBloqueado, setMostrarCaseBloqueado] = useState(false)

  const audioRef = useRef(null)
  const backgroundAudioRef = useRef(null)

  const iniciarMusica = () => {
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.play().catch(() => {})
    }
  }

  // =========================
  // CARGAR SUBMISSIONS ADMIN
  // =========================

  const cargarSubmissions = async () => {
    setLoadingSubmissions(true)

    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("SUBMISSIONS ERROR:", error)
      setAdminMessage("ARCHIVE ERROR — Unable to load submissions.")
      setLoadingSubmissions(false)
      return
    }

    setSubmissions(data || [])
    setLoadingSubmissions(false)
  }

  // =========================
  // CARGAR SUBMISSIONS PUBLICAS
  // =========================

  const cargarPublicSubmissions = async () => {
    setLoadingPublicSubmissions(true)

    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("PUBLIC SUBMISSIONS ERROR:", error)
      setLoadingPublicSubmissions(false)
      return
    }

    setPublicSubmissions(data || [])
    setLoadingPublicSubmissions(false)
  }

  // =========================
  // CARGAR PUBLICACIONES
  // =========================

  useEffect(() => {
    cargarPublicSubmissions()
  }, [])

  // =========================
  // CARGAR SUBMISSIONS ADMIN
  // =========================

  useEffect(() => {
    if (adminUser) {
      cargarSubmissions()
    }
  }, [adminUser])

  // =========================
  // GLITCH DE LETRAS
  // =========================

  useEffect(() => {
    const caracteres = [
      "Α",
      "Β",
      "Γ",
      "Δ",
      "Ε",
      "Ζ",
      "Η",
      "Θ",
      "Λ",
      "Ξ",
      "Π",
      "Σ",
      "Φ",
      "Ψ",
      "Ω",
      "Æ",
      "Ð",
      "Þ",
      "Ŧ",
      "Ȝ",
    ]

    const intervalo = setInterval(() => {
      const posicion = Math.floor(Math.random() * 13)

      if (posicion === 5) return

      const caracter =
        caracteres[Math.floor(Math.random() * caracteres.length)]

      setLetrasGlitch({
        [posicion]: caracter,
      })

      setTimeout(() => {
        setLetrasGlitch({})
      }, 350)
    }, 5000)

    return () => clearInterval(intervalo)
  }, [])

  // =========================
  // AUDIO DEL CASO
  // =========================

  useEffect(() => {
    if (audioReproduciendo) {
      audioRef.current?.play().catch(() => {})
    } else {
      audioRef.current?.pause()

      if (audioRef.current) {
        audioRef.current.currentTime = 0
      }
    }
  }, [audioReproduciendo])

  // =========================
  // VOLUMEN DE MUSICA
  // =========================

  useEffect(() => {
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.volume = volumen
    }
  }, [volumen])

  // =========================
  // CAMBIO DE MUSICA
  // =========================

  useEffect(() => {
    const audio = backgroundAudioRef.current

    if (!audio) return

    let volumenActual = audio.volume

    const fadeOut = setInterval(() => {
      volumenActual -= 0.05

      if (volumenActual <= 0) {
        clearInterval(fadeOut)

        audio.volume = 0
        audio.load()

        audio.play().catch(() => {})

        let nuevoVolumen = 0

        const fadeIn = setInterval(() => {
          nuevoVolumen += 0.05

          if (nuevoVolumen >= volumen) {
            nuevoVolumen = volumen
            clearInterval(fadeIn)
          }

          audio.volume = nuevoVolumen
        }, 100)
      } else {
        audio.volume = volumenActual
      }
    }, 100)

    return () => {
      clearInterval(fadeOut)
    }
  }, [seccion])

  // =========================
  // MODERAR SUBMISSION
  // =========================

  const actualizarSubmission = async (id, nuevoStatus) => {
    const { data, error } = await supabase
      .from("submissions")
      .update({
        status: nuevoStatus,
      })
      .eq("id", id)
      .select()

    if (error) {
      console.error("UPDATE SUBMISSION ERROR:", error)
      setAdminMessage("ACTION FAILED — Unable to update submission.")
      return
    }

    setSubmissions((actuales) =>
      actuales.map((submission) =>
        submission.id === id
          ? { ...submission, status: nuevoStatus }
          : submission
      )
    )

    if (nuevoStatus === "approved") {
      const submissionAprobada = data?.[0]

      if (submissionAprobada) {
        setPublicSubmissions((actuales) => [
          submissionAprobada,
          ...actuales.filter(
            (submission) => submission.id !== id
          ),
        ])
      }
    } else {
      setPublicSubmissions((actuales) =>
        actuales.filter(
          (submission) => submission.id !== id
        )
      )
    }

    setAdminMessage(
      `SUBMISSION ${nuevoStatus.toUpperCase()}`
    )
  }

  // =========================
  // ELIMINAR SUBMISSION
  // =========================

  const eliminarSubmission = async (id) => {
    const { error } = await supabase
      .from("submissions")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("DELETE SUBMISSION ERROR:", error)
      setAdminMessage("DELETE FAILED — Unable to remove submission.")
      return
    }

    setSubmissions((actuales) =>
      actuales.filter((submission) => submission.id !== id)
    )

    setPublicSubmissions((actuales) =>
      actuales.filter((submission) => submission.id !== id)
    )

    setAdminMessage("SUBMISSION DELETED")
  }

  // =========================
  // LOGIN ADMIN
  // =========================

  const iniciarSesionAdmin = async (e) => {
    e.preventDefault()

    setAdminMessage("AUTHENTICATING...")

    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    })

    if (error) {
      console.error("ADMIN LOGIN ERROR:", error)
      setAdminMessage("ACCESS DENIED — Invalid credentials.")
      return
    }

    setAdminUser(data.user)
    setAdminPassword("")
    setAdminMessage("ACCESS GRANTED")
  }

  // =========================
  // ENVIAR HISTORIA
  // =========================

  const enviarHistoria = async (e) => {
    e.preventDefault()

    setSendingSubmission(true)
    setSubmissionMessage("")

    const { error } = await supabase
      .from("submissions")
      .insert([
        {
          title: submission.title,
          story: submission.story,
          Location: submission.location,
          Date: submission.date,
          Category: submission.category,
          author_name: submission.author_name,
          status: "pending",
        },
      ])

    setSendingSubmission(false)

    if (error) {
      console.error("SUPABASE ERROR:", error)

      setSubmissionMessage(
        "SUBMISSION FAILED — Please try again later."
      )

      return
    }

    setSubmission({
      title: "",
      story: "",
      location: "",
      date: "",
      category: "Case",
      author_name: "",
    })

    setSubmissionMessage(
      "SUBMISSION RECEIVED — Your report has been submitted for archival review."
    )
  }

  // =========================
  // FILTROS PUBLICOS
  // =========================

  const publicCases = publicSubmissions.filter(
    (submission) => submission.Category === "Case"
  )

  const publicEntities = publicSubmissions.filter(
    (submission) => submission.Category === "Entity"
  )

  const publicLocations = publicSubmissions.filter(
    (submission) => submission.Category === "Location"
  )

  const publicIncidents = publicSubmissions.filter(
    (submission) => submission.Category === "Incident"
  )

  return (
    <div>

      {/* =========================
          AUDIO
      ========================= */}

      <audio
        ref={audioRef}
        src="/Audio/AUDIO_001.wav"
      />

      <audio
        ref={backgroundAudioRef}
        src={musicaPorSeccion[seccion]}
        loop
        preload="auto"
      />

      {/* =========================
          TOP BAR
      ========================= */}

      <div className="top-bar">
        <span>BLACK ARCHIVE</span>
        <span>CASE FILE SYSTEM</span>
      </div>

      {/* =========================
          TITLE
      ========================= */}

      <h1
        className={`archive-title ${
          seccion === "home" ? "home-title" : ""
        }`}
      >
        {"BLACK ARCHIVE".split("").map((letra, indice) => (
          <span key={indice}>
            {letrasGlitch[indice] || letra}
          </span>
        ))}
      </h1>

      <h3
        className={
          seccion === "home"
            ? "home-intro-subtitle"
            : ""
        }
      >
        CLASSIFICATION: CONFIDENTIAL
      </h3>

      {/* =====================================================
          HOME
      ===================================================== */}

      {seccion === "home" && (
        <>
          <p className="archive-description">
            Archive Of Unexplained Phenomena
          </p>

          <div className="menu">

            <button
              onClick={() => {
                iniciarMusica()
                setSeccion("cases")
                setMostrarArchivoBloqueado(false)
                setMostrarCaseBloqueado(false)

                setTimeout(() => {
                  setMostrarArchivoBloqueado(true)

                  setTimeout(() => {
                    setMostrarCaseBloqueado(true)
                  }, 700)

                }, 1800)
              }}
            >
              CASE FILES
            </button>

            <button
              onClick={() => setSeccion("entities")}
            >
              ENTITIES
            </button>

            <button
              onClick={() => setSeccion("locations")}
            >
              LOCATIONS
            </button>

            <button
              onClick={() => setSeccion("incidents")}
            >
              INCIDENTS
            </button>

            <button
              onClick={() => setSeccion("submit")}
            >
              SUBMIT A STORY
            </button>

            <button
              onClick={() => setSeccion("admin")}
            >
              ADMIN
            </button>

          </div>

          <div className="volume-control">

            <label>BACKGROUND AUDIO</label>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volumen}
              onChange={(e) =>
                setVolumen(Number(e.target.value))
              }
            />

            <span>
              {Math.round(volumen * 100)}%
            </span>

          </div>
        </>
      )}

      {/* =====================================================
          SUBMIT A STORY
      ===================================================== */}

      {seccion === "submit" && (
        <section className="submit-section">

          <h2>SUBMIT A STORY</h2>

          <p className="submit-intro">
            Have you experienced something you cannot explain?
            Submit your report to the Black Archive.
          </p>

          <form
            className="submission-form"
            onSubmit={enviarHistoria}
          >

            <label>
              TITLE

              <input
                type="text"
                value={submission.title}
                onChange={(e) =>
                  setSubmission({
                    ...submission,
                    title: e.target.value,
                  })
                }
                required
                minLength={3}
                maxLength={100}
                placeholder="Give your report a title"
              />
            </label>

            <label>
              YOUR STORY

              <textarea
                value={submission.story}
                onChange={(e) =>
                  setSubmission({
                    ...submission,
                    story: e.target.value,
                  })
                }
                required
                minLength={20}
                maxLength={5000}
                placeholder="Describe what happened..."
              />
            </label>

            <label>
              LOCATION

              <input
                type="text"
                value={submission.location}
                onChange={(e) =>
                  setSubmission({
                    ...submission,
                    location: e.target.value,
                  })
                }
                placeholder="Where did this happen?"
              />
            </label>

            <label>
              DATE / YEAR

              <input
                type="text"
                value={submission.date}
                onChange={(e) =>
                  setSubmission({
                    ...submission,
                    date: e.target.value,
                  })
                }
                placeholder="Example: 2024"
              />
            </label>

            <label>
              CATEGORY

              <select
                value={submission.category}
                onChange={(e) =>
                  setSubmission({
                    ...submission,
                    category: e.target.value,
                  })
                }
              >
                <option value="Case">
                  CASE
                </option>

                <option value="Entity">
                  ENTITY
                </option>

                <option value="Location">
                  LOCATION
                </option>

                <option value="Incident">
                  INCIDENT
                </option>
              </select>
            </label>

            <label>
              YOUR NAME

              <input
                type="text"
                value={submission.author_name}
                onChange={(e) =>
                  setSubmission({
                    ...submission,
                    author_name: e.target.value,
                  })
                }
                placeholder="Optional"
              />
            </label>

            <button
              type="submit"
              disabled={sendingSubmission}
              className="submit-button"
            >
              {sendingSubmission
                ? "TRANSMITTING..."
                : "SUBMIT REPORT"}
            </button>

            {submissionMessage && (
              <p className="submission-message">
                {submissionMessage}
              </p>
            )}

          </form>

          <button
            onClick={() => {
              setSubmissionMessage("")
              setSeccion("home")
            }}
          >
            BACK TO HOME
          </button>

        </section>
      )}

      {/* =====================================================
          CASE FILES
      ===================================================== */}

      {seccion === "cases" && (
        <div className="case-list">

          <h2>CASE FILES</h2>

          <p>
            Classified records of unexplained phenomena.
          </p>

          <button
            onClick={() => setArchivoAbierto(true)}
          >
            CASE #001 — THE EMPTY ROOM
          </button>

          {/* PUBLIC APPROVED CASES */}

          {publicCases.length > 0 && (
            <>
              <h3>COMMUNITY CASE FILES</h3>

              {publicCases.map((item) => (
                <article
                  key={item.id}
                  className="evidence"
                >
                  <p>
                    <strong>TITLE:</strong>{" "}
                    {item.title}
                  </p>

                  <p>
                    <strong>LOCATION:</strong>{" "}
                    {item.Location || "UNKNOWN"}
                  </p>

                  <p>
                    <strong>DATE:</strong>{" "}
                    {item.Date || "UNKNOWN"}
                  </p>

                  <p>
                    <strong>AUTHOR:</strong>{" "}
                    {item.author_name || "ANONYMOUS"}
                  </p>

                  <p>
                    <strong>STATUS:</strong> ARCHIVED
                  </p>

                  <p>
                    {item.story}
                  </p>

                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt="Submitted evidence"
                      className="submitted-image"
                    />
                  )}
                </article>
              ))}
            </>
          )}

          {loadingPublicSubmissions && (
            <p>CHECKING COMMUNITY ARCHIVES...</p>
          )}

          <br />

          <button
            onClick={() => {
              setSeccion("home")
              setMostrarArchivoBloqueado(false)
              setMostrarCaseBloqueado(false)
            }}
          >
            BACK TO HOME
          </button>

        </div>
      )}

      {/* =========================
          LOCKED CASE
      ========================= */}

      {mostrarArchivoBloqueado && (
        <div className="access-log">
          &gt; ACCESS ATTEMPT LOGGED
        </div>
      )}

      {mostrarCaseBloqueado && (
        <div className="locked-case">
          <div>CASE FILE #004</div>
          <div>████████████████</div>
          <div>ACCESS DENIED</div>
          <div>CLEARANCE LEVEL: 05 REQUIRED</div>
        </div>
      )}

      {/* =====================================================
          LOCATIONS
      ===================================================== */}

      {seccion === "locations" && (
        <div className="case-list">

          <h2>LOCATION DATABASE</h2>

          <p>
            Classified records concerning anomalous locations.
          </p>

          <div className="evidence">

            <p>LOCATION #001</p>
            <p>DESIGNATION: THE EMPTY HOSPITAL</p>
            <p>CLASSIFICATION: ANOMALOUS</p>
            <p>THREAT LEVEL: HIGH</p>

            <button
              onClick={() => setUbicacionAbierta(1)}
            >
              OPEN LOCATION FILE
            </button>

          </div>

          <div className="evidence">

            <p>LOCATION #002</p>
            <p>DESIGNATION: BLACKWOOD FOREST</p>
            <p>CLASSIFICATION: UNCONFIRMED</p>
            <p>THREAT LEVEL: UNKNOWN</p>

            <button
              onClick={() => setUbicacionAbierta(2)}
            >
              OPEN LOCATION FILE
            </button>

          </div>

          <div className="evidence">

            <p>LOCATION #003</p>
            <p>DESIGNATION: ██████████</p>
            <p>CLASSIFICATION: RESTRICTED</p>
            <p>THREAT LEVEL: CRITICAL</p>

            <button
              onClick={() => setUbicacionAbierta(3)}
            >
              OPEN LOCATION FILE
            </button>

          </div>

          {/* PUBLIC APPROVED LOCATIONS */}

          {publicLocations.length > 0 && (
            <>
              <h3>COMMUNITY LOCATION ARCHIVES</h3>

              {publicLocations.map((item) => (
                <article
                  key={item.id}
                  className="evidence"
                >
                  <p>
                    <strong>DESIGNATION:</strong>{" "}
                    {item.title}
                  </p>

                  <p>
                    <strong>LOCATION:</strong>{" "}
                    {item.Location || "UNKNOWN"}
                  </p>

                  <p>
                    <strong>DATE:</strong>{" "}
                    {item.Date || "UNKNOWN"}
                  </p>

                  <p>
                    <strong>AUTHOR:</strong>{" "}
                    {item.author_name || "ANONYMOUS"}
                  </p>

                  <p>
                    {item.story}
                  </p>

                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt="Submitted evidence"
                      className="submitted-image"
                    />
                  )}
                </article>
              ))}
            </>
          )}

          <button
            onClick={() => setSeccion("home")}
          >
            BACK TO HOME
          </button>

        </div>
      )}

      {/* =====================================================
          INCIDENTS
      ===================================================== */}

      {seccion === "incidents" && (
        <div className="case-list">

          <h2>INCIDENT DATABASE</h2>

          <p>
            Classified records of unexplained incidents and
            anomalous events.
          </p>

          <div className="evidence">

            <p>INCIDENT #001</p>
            <p>DESIGNATION: THE STATIC CALL</p>
            <p>CLASSIFICATION: UNEXPLAINED</p>
            <p>THREAT LEVEL: LOW</p>

            <button
              onClick={() => setIncidenteAbierto(1)}
            >
              OPEN INCIDENT FILE
            </button>

          </div>

          <div className="evidence">

            <p>INCIDENT #002</p>
            <p>DESIGNATION: THE MISSING HOUR</p>
            <p>CLASSIFICATION: TEMPORAL ANOMALY</p>
            <p>THREAT LEVEL: MEDIUM</p>

            <button
              onClick={() => setIncidenteAbierto(2)}
            >
              OPEN INCIDENT FILE
            </button>

          </div>

          <div className="evidence">

            <p>INCIDENT #003</p>
            <p>DESIGNATION: THE EMPTY CALLER</p>
            <p>CLASSIFICATION: UNCONFIRMED</p>
            <p>THREAT LEVEL: UNKNOWN</p>

            <button
              onClick={() => setIncidenteAbierto(3)}
            >
              OPEN INCIDENT FILE
            </button>

          </div>

          <div className="evidence">

            <p>INCIDENT #004</p>
            <p>DESIGNATION: ██████████</p>
            <p>CLASSIFICATION: RESTRICTED</p>
            <p>THREAT LEVEL: CRITICAL</p>

            <button
              onClick={() => setIncidenteAbierto(4)}
            >
              OPEN INCIDENT FILE
            </button>

          </div>

          {/* PUBLIC APPROVED INCIDENTS */}

          {publicIncidents.length > 0 && (
            <>
              <h3>COMMUNITY INCIDENT ARCHIVES</h3>

              {publicIncidents.map((item) => (
                <article
                  key={item.id}
                  className="evidence"
                >
                  <p>
                    <strong>DESIGNATION:</strong>{" "}
                    {item.title}
                  </p>

                  <p>
                    <strong>LOCATION:</strong>{" "}
                    {item.Location || "UNKNOWN"}
                  </p>

                  <p>
                    <strong>DATE:</strong>{" "}
                    {item.Date || "UNKNOWN"}
                  </p>

                  <p>
                    <strong>AUTHOR:</strong>{" "}
                    {item.author_name || "ANONYMOUS"}
                  </p>

                  <p>
                    {item.story}
                  </p>

                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt="Submitted evidence"
                      className="submitted-image"
                    />
                  )}
                </article>
              ))}
            </>
          )}

          <button
            onClick={() => setSeccion("home")}
          >
            BACK TO HOME
          </button>

        </div>
      )}

      {/* =====================================================
          ADMIN
      ===================================================== */}

      {seccion === "admin" && (
        <section className="admin-section">

          <h2>BLACK ARCHIVE — ADMIN ACCESS</h2>

          {!adminUser ? (
            <form
              className="admin-login-form"
              onSubmit={iniciarSesionAdmin}
            >

              <label>
                ADMIN EMAIL

                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  placeholder="Enter administrator email"
                />
              </label>

              <label>
                PASSWORD

                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  placeholder="Enter password"
                />
              </label>

              <button type="submit">
                AUTHENTICATE
              </button>

              {adminMessage && (
                <p className="admin-message">
                  {adminMessage}
                </p>
              )}

            </form>
          ) : (
            <div className="admin-dashboard">

              <h3>ACCESS GRANTED</h3>

              <p>
                Administrator session active.
              </p>

              <p>
                {adminUser.email}
              </p>

              <hr />

              <h3>SUBMISSIONS</h3>

              {loadingSubmissions ? (
                <p>LOADING ARCHIVE...</p>
              ) : submissions.length === 0 ? (
                <p>NO SUBMISSIONS FOUND.</p>
              ) : (
                <div className="admin-submissions">

                  {submissions.map((submission) => (
                    <article
                      key={submission.id}
                      className="admin-submission"
                    >

                      <h4>
                        {submission.title}
                      </h4>

                      <p>
                        <strong>CATEGORY:</strong>{" "}
                        {submission.Category}
                      </p>

                      <p>
                        <strong>LOCATION:</strong>{" "}
                        {submission.Location || "UNKNOWN"}
                      </p>

                      <p>
                        <strong>DATE:</strong>{" "}
                        {submission.Date || "UNKNOWN"}
                      </p>

                      <p>
                        <strong>AUTHOR:</strong>{" "}
                        {submission.author_name || "ANONYMOUS"}
                      </p>

                      <p>
                        <strong>STATUS:</strong>{" "}
                        {submission.status}
                      </p>

                      <p>
                        {submission.story}
                      </p>

                      {submission.image_url && (
                        <img
                          src={submission.image_url}
                          alt="Submitted evidence"
                          className="submitted-image"
                        />
                      )}

                      <div className="admin-actions">

                        {submission.status !== "approved" && (
                          <button
                            onClick={() =>
                              actualizarSubmission(
                                submission.id,
                                "approved"
                              )
                            }
                          >
                            APPROVE
                          </button>
                        )}

                        {submission.status !== "rejected" && (
                          <button
                            onClick={() =>
                              actualizarSubmission(
                                submission.id,
                                "rejected"
                              )
                            }
                          >
                            REJECT
                          </button>
                        )}

                        <button
                          onClick={() =>
                            eliminarSubmission(
                              submission.id
                            )
                          }
                        >
                          DELETE
                        </button>

                      </div>

                    </article>
                  ))}

                </div>
              )}

              {adminMessage && (
                <p className="admin-message">
                  {adminMessage}
                </p>
              )}

            </div>
          )}

          <button
            onClick={() => setSeccion("home")}
          >
            BACK TO HOME
          </button>

        </section>
      )}

      {/* =====================================================
          ENTITIES
      ===================================================== */}

      {seccion === "entities" && (
        <div className="case-list">

          <h2>ENTITY DATABASE</h2>

          <p>
            Classified records concerning unidentified entities.
          </p>

          <div className="evidence">

            <p>ENTITY #001</p>
            <p>DESIGNATION: THE WATCHER</p>
            <p>CLASSIFICATION: UNKNOWN</p>
            <p>THREAT LEVEL: HIGH</p>

            <button
              onClick={() => setEntidadAbierta(1)}
            >
              OPEN ENTITY FILE
            </button>

          </div>

          <div className="evidence">

            <p>ENTITY #002</p>
            <p>DESIGNATION: THE MAN IN THE HALL</p>
            <p>CLASSIFICATION: UNCONFIRMED</p>
            <p>THREAT LEVEL: UNKNOWN</p>

            <button
              onClick={() => setEntidadAbierta(2)}
            >
              OPEN ENTITY FILE
            </button>

          </div>

          <div className="evidence">

            <p>ENTITY #003</p>
            <p>DESIGNATION: [REDACTED]</p>
            <p>CLASSIFICATION: ████████</p>
            <p>THREAT LEVEL: CRITICAL</p>

            <button
              onClick={() => setEntidadAbierta(3)}
            >
              OPEN ENTITY FILE
            </button>

          </div>

          {/* PUBLIC APPROVED ENTITIES */}

          {publicEntities.length > 0 && (
            <>
              <h3>COMMUNITY ENTITY ARCHIVES</h3>

              {publicEntities.map((item) => (
                <article
                  key={item.id}
                  className="evidence"
                >
                  <p>
                    <strong>DESIGNATION:</strong>{" "}
                    {item.title}
                  </p>

                  <p>
                    <strong>LOCATION:</strong>{" "}
                    {item.Location || "UNKNOWN"}
                  </p>

                  <p>
                    <strong>DATE:</strong>{" "}
                    {item.Date || "UNKNOWN"}
                  </p>

                  <p>
                    <strong>AUTHOR:</strong>{" "}
                    {item.author_name || "ANONYMOUS"}
                  </p>

                  <p>
                    {item.story}
                  </p>

                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt="Submitted evidence"
                      className="submitted-image"
                    />
                  )}
                </article>
              ))}
            </>
          )}

          <button
            onClick={() => setSeccion("home")}
          >
            BACK TO HOME
          </button>

        </div>
      )}

      {/* =====================================================
          ENTITY #001
      ===================================================== */}

      {entidadAbierta === 1 && (
        <div className="archivo">

          <h2>ENTITY #001</h2>

          <p>DESIGNATION: THE WATCHER</p>
          <p>CLASSIFICATION: UNKNOWN</p>
          <p>THREAT LEVEL: HIGH</p>
          <p>STATUS: ACTIVE</p>
          <p>ORIGIN: UNKNOWN</p>

          <h3>DESCRIPTION</h3>

          <p>
            The Watcher is an unidentified humanoid entity
            reportedly observed in locations with limited
            human activity.
          </p>

          <p>
            Witnesses consistently describe a tall figure
            standing at a considerable distance from them.
          </p>

          <p>
            The entity does not appear to approach its targets.
            Instead, it remains stationary and observes them.
          </p>

          <p>
            Attempts to approach the entity have resulted in
            sudden visual distortion and temporary loss of
            surveillance footage.
          </p>

          <h3>BEHAVIOR</h3>

          <p>
            The Watcher appears to remain passive unless
            directly observed for an extended period.
          </p>

          <p>
            Personnel are instructed not to approach,
            communicate with, or attempt to identify the entity.
          </p>

          <h3>KNOWN INCIDENTS</h3>

          <p>
            INCIDENT #014 — Three security cameras recorded
            the same unidentified figure at different
            locations simultaneously.
          </p>

          <p>
            INCIDENT #027 — A field investigator reported
            seeing the entity through a window. The building
            had no windows facing the reported location.
          </p>

          <p>
            INCIDENT #031 — All surveillance equipment
            within a restricted area stopped functioning
            for exactly seventeen seconds.
          </p>

          <h3>ARCHIVE NOTE</h3>

          <p>
            The reason for the entity's apparent interest
            in human observers remains unknown.
          </p>

          <p>
            Further investigation is prohibited without
            authorization from BLACK ARCHIVE command.
          </p>

          <button
            onClick={() => setEntidadAbierta(null)}
          >
            CLOSE ENTITY FILE
          </button>

        </div>
      )}

      {/* =====================================================
          ENTITY #002
      ===================================================== */}

      {entidadAbierta === 2 && (
        <div className="archivo">

          <h2>ENTITY #002</h2>

          <p>DESIGNATION: THE MAN IN THE HALL</p>
          <p>CLASSIFICATION: UNCONFIRMED</p>
          <p>THREAT LEVEL: UNKNOWN</p>
          <p>STATUS: UNCONFIRMED</p>
          <p>ORIGIN: UNKNOWN</p>

          <h3>DESCRIPTION</h3>

          <p>
            The Man in the Hall is an unidentified humanoid
            figure reportedly observed inside residential
            and institutional buildings.
          </p>

          <p>
            Witnesses describe the entity as a tall individual
            standing motionless at the end of a hallway.
          </p>

          <p>
            The entity has never been observed approaching
            witnesses directly.
          </p>

          <h3>BEHAVIOR</h3>

          <p>
            The entity appears to remain stationary while
            maintaining visual contact with nearby observers.
          </p>

          <p>
            Witnesses frequently report that the hallway
            appears significantly longer than it was before
            the entity was observed.
          </p>

          <p>
            Attempts to approach the entity have resulted in
            loss of visual contact.
          </p>

          <h3>KNOWN INCIDENTS</h3>

          <p>
            INCIDENT #008 — A resident reported seeing a
            motionless figure at the end of a hallway at
            approximately 02:41 AM.
          </p>

          <p>
            INCIDENT #019 — Security footage showed an
            unidentified figure standing inside an empty
            corridor. The footage contained no record of
            the figure entering the building.
          </p>

          <p>
            INCIDENT #033 — A witness reported walking toward
            the entity for approximately three minutes.
            The distance between them did not change.
          </p>

          <h3>ARCHIVE NOTE</h3>

          <p>
            Personnel are advised to leave the area immediately
            if the entity is observed.
          </p>

          <p>
            Do not attempt to approach the figure or determine
            its identity.
          </p>

          <button
            onClick={() => setEntidadAbierta(null)}
          >
            CLOSE ENTITY FILE
          </button>

        </div>
      )}

      {/* =====================================================
          ENTITY #003
      ===================================================== */}

      {entidadAbierta === 3 && (
        <div className="archivo">

          <h2>ENTITY #003</h2>

          <p>DESIGNATION: [REDACTED]</p>
          <p>CLASSIFICATION: ████████</p>
          <p>THREAT LEVEL: CRITICAL</p>
          <p>STATUS: ACTIVE</p>
          <p>ORIGIN: UNKNOWN</p>

          <h3>DESCRIPTION</h3>

          <p>
            All information concerning Entity #003 has been
            partially or completely removed from the archive.
          </p>

          <p>
            Surviving personnel reports describe an unidentified
            presence capable of appearing within restricted
            locations without triggering security systems.
          </p>

          <p>
            The entity has never been successfully photographed
            under controlled conditions.
          </p>

          <p>
            Attempts to document its physical characteristics
            have resulted in corrupted files and missing records.
          </p>

          <h3>BEHAVIOR</h3>

          <p>
            Entity #003 appears to demonstrate awareness of
            surveillance equipment and archival procedures.
          </p>

          <p>
            Personnel have reported finding previously recorded
            information altered after encountering the entity.
          </p>

          <p>
            The reason for this behavior remains unknown.
          </p>

          <h3>KNOWN INCIDENTS</h3>

          <p>
            INCIDENT #004 — An entire security archive was found
            with every recording from a twelve-hour period replaced
            by identical footage of an empty corridor.
          </p>

          <p>
            INCIDENT #016 — A researcher reported receiving a
            document containing information about an investigation
            that had not yet occurred.
          </p>

          <p>
            INCIDENT #029 — Seven personnel entered a restricted
            facility. Only six were recorded leaving.
          </p>

          <p>
            No missing person was reported.
          </p>

          <h3>ARCHIVE WARNING</h3>

          <p>
            ACCESS TO THIS FILE HAS BEEN RESTRICTED BY BLACK
            ARCHIVE COMMAND.
          </p>

          <p>
            Further investigation is considered unsafe.
          </p>

          <p>
            Personnel are prohibited from attempting to establish
            direct contact with Entity #003.
          </p>

          <h3>FINAL NOTE</h3>

          <p>
            █████████████████████████████████████████
          </p>

          <p>
            If this file appears complete, terminate the session
            immediately.
          </p>

          <button
            onClick={() => setEntidadAbierta(null)}
          >
            CLOSE ENTITY FILE
          </button>

        </div>
      )}

      {/* =====================================================
          LOCATION #001
      ===================================================== */}

      {ubicacionAbierta === 1 && (
        <div className="archivo">

          <h2>LOCATION #001</h2>

          <p>DESIGNATION: THE EMPTY HOSPITAL</p>
          <p>CLASSIFICATION: ANOMALOUS</p>
          <p>THREAT LEVEL: HIGH</p>
          <p>STATUS: RESTRICTED</p>
          <p>LOCATION: [REDACTED]</p>
          <p>FIRST RECORDED: 1974</p>

          <h3>DESCRIPTION</h3>

          <p>
            The Empty Hospital is an abandoned medical facility
            located in an undisclosed rural area.
          </p>

          <p>
            The building was officially closed in 1974 following
            the disappearance of several patients and members of
            the medical staff.
          </p>

          <p>
            No official records explain what happened to the
            missing individuals.
          </p>

          <p>
            Despite having no active electrical supply, lights
            have been repeatedly observed operating inside the
            building during nighttime.
          </p>

          <h3>ANOMALOUS ACTIVITY</h3>

          <p>
            Investigators have reported hearing hospital
            equipment operating inside rooms containing no
            electrical devices.
          </p>

          <p>
            Several witnesses have also reported hearing
            footsteps moving through the corridors while the
            building was confirmed to be empty.
          </p>

          <p>
            Medical records have occasionally been discovered
            inside the building despite having been removed from
            the facility decades earlier.
          </p>

          <h3>KNOWN INCIDENTS</h3>

          <p>
            INCIDENT #006 — A three-person investigation team
            reported hearing a hospital intercom announce the
            name of a patient who had been missing since 1974.
          </p>

          <p>
            INCIDENT #018 — A researcher entered the second floor
            and reported seeing several occupied hospital beds.
            Photographs taken moments later showed an empty room.
          </p>

          <p>
            INCIDENT #041 — A field team recorded the sound of
            approximately twelve people walking through a corridor.
            Only three investigators were present inside the building.
          </p>

          <h3>ARCHIVE WARNING</h3>

          <p>
            Entry into the facility is prohibited without Level 04
            authorization.
          </p>

          <p>
            Personnel are instructed not to respond to voices
            originating from empty rooms.
          </p>

          <h3>ARCHIVE NOTE</h3>

          <p>
            The hospital remains structurally unstable.
          </p>

          <p>
            However, structural instability does not explain the
            anomalous activity documented within the facility.
          </p>

          <button
            onClick={() => setUbicacionAbierta(null)}
          >
            CLOSE LOCATION FILE
          </button>

        </div>
      )}

      {/* =====================================================
          LOCATION #002
      ===================================================== */}

      {ubicacionAbierta === 2 && (
        <div className="archivo">

          <h2>LOCATION #002</h2>

          <p>DESIGNATION: BLACKWOOD FOREST</p>
          <p>CLASSIFICATION: UNCONFIRMED</p>
          <p>THREAT LEVEL: UNKNOWN</p>
          <p>STATUS: ACTIVE</p>
          <p>LOCATION: [REDACTED]</p>
          <p>FIRST RECORDED: 1987</p>

          <h3>DESCRIPTION</h3>

          <p>
            Blackwood Forest is a large woodland area located
            approximately 40 kilometers from the nearest known
            settlement.
          </p>

          <p>
            The area appears normal during daylight hours.
            However, multiple reports describe unusual activity
            occurring after sunset.
          </p>

          <p>
            Several explorers have reported becoming disoriented
            despite using GPS equipment and marked trails.
          </p>

          <h3>ANOMALOUS ACTIVITY</h3>

          <p>
            Witnesses have reported hearing footsteps following
            them through the forest.
          </p>

          <p>
            In several cases, the footsteps stopped whenever the
            witness stopped moving.
          </p>

          <p>
            Investigators have also documented trees displaying
            markings that were not present during previous surveys.
          </p>

          <p>
            Some markings appear to resemble human names.
          </p>

          <h3>KNOWN INCIDENTS</h3>

          <p>
            INCIDENT #009 — Two hikers reported hearing someone
            calling their names from deeper inside the forest.
            No additional person was found in the area.
          </p>

          <p>
            INCIDENT #017 — A search team discovered a backpack
            belonging to a missing hiker approximately three
            kilometers from the location where he was last seen.
          </p>

          <p>
            INCIDENT #032 — A field recorder captured several
            minutes of unidentified movement surrounding the
            investigation team.
          </p>

          <h3>ARCHIVE WARNING</h3>

          <p>
            Personnel are instructed to remain on marked trails
            after sunset.
          </p>

          <p>
            If footsteps are heard following personnel,
            communication between team members must be maintained.
          </p>

          <p>
            Personnel must not respond to voices calling their
            names from outside the visible area.
          </p>

          <h3>ARCHIVE NOTE</h3>

          <p>
            The exact nature of the phenomenon remains unknown.
          </p>

          <p>
            Investigation of Blackwood Forest remains ongoing.
          </p>

          <button
            onClick={() => setUbicacionAbierta(null)}
          >
            CLOSE LOCATION FILE
          </button>

        </div>
      )}

      {/* =====================================================
          LOCATION #003
      ===================================================== */}

      {ubicacionAbierta === 3 && (
        <div className="archivo">

          <h2>LOCATION #003</h2>

          <p>DESIGNATION: ██████████</p>
          <p>CLASSIFICATION: RESTRICTED</p>
          <p>THREAT LEVEL: CRITICAL</p>
          <p>STATUS: ACTIVE</p>
          <p>LOCATION: [REDACTED]</p>
          <p>FIRST RECORDED: ███████</p>

          <h3>DESCRIPTION</h3>

          <p>
            All information regarding this location has been
            classified under Level 05 security protocols.
          </p>

          <p>
            The location does not appear on any known satellite
            database, government map, or publicly accessible
            geographic record.
          </p>

          <p>
            Personnel assigned to investigate the area reported
            significant discrepancies between recorded coordinates
            and their actual surroundings.
          </p>

          <h3>ANOMALOUS ACTIVITY</h3>

          <p>
            Electronic devices frequently lose synchronization
            when approaching the designated perimeter.
          </p>

          <p>
            GPS systems have displayed coordinates corresponding
            to locations that do not exist.
          </p>

          <p>
            Audio recordings recovered from the area contain
            unidentified voices that were not audible during the
            original recording.
          </p>

          <p>
            Several recordings also contain references to personnel
            who had not yet entered the location at the time the
            recordings were created.
          </p>

          <h3>KNOWN INCIDENTS</h3>

          <p>
            INCIDENT #013 — A four-person reconnaissance team
            entered the restricted zone. Only three members
            returned.
          </p>

          <p>
            INCIDENT #021 — A recovered camera contained footage
            dated three days after the device was recovered.
          </p>

          <p>
            INCIDENT #044 — A researcher reported seeing the
            investigation team standing approximately 200 meters
            ahead of him despite remaining inside the team's
            original formation.
          </p>

          <h3>ARCHIVE WARNING</h3>

          <p>
            ACCESS TO THIS LOCATION IS STRICTLY PROHIBITED.
          </p>

          <p>
            No personnel are permitted to enter the designated
            area without Level 05 authorization.
          </p>

          <p>
            If visual contact with another member of the team is
            lost, personnel must not attempt to locate them.
          </p>

          <h3>FINAL ARCHIVE NOTE</h3>

          <p>
            The nature of LOCATION #003 remains unknown.
          </p>

          <p>
            All further documentation concerning this location
            has been classified.
          </p>

          <p>
            ████████████████████████████████████
          </p>

          <button
            onClick={() => setUbicacionAbierta(null)}
          >
            CLOSE LOCATION FILE
          </button>

        </div>
      )}

      {/* =====================================================
          INCIDENT #001
      ===================================================== */}

      {incidenteAbierto === 1 && (
        <div className="archivo">

          <h2>INCIDENT #001</h2>

          <p>DESIGNATION: THE STATIC CALL</p>
          <p>CLASSIFICATION: UNEXPLAINED</p>
          <p>THREAT LEVEL: LOW</p>
          <p>STATUS: CLOSED</p>

          <hr />

          <p>DATE RECORDED: ███████</p>
          <p>LOCATION: [REDACTED]</p>
          <p>SUBJECT: UNKNOWN</p>

          <h3>INCIDENT SUMMARY</h3>

          <p>
            At approximately 02:13 AM, an unidentified telephone call
            was received by a civilian residence.
          </p>

          <p>
            The caller produced only static noise.
            No identifiable voice could be heard during the call.
          </p>

          <p>
            The call lasted approximately 47 seconds before disconnecting.
          </p>

          <h3>ANOMALOUS DETAILS</h3>

          <p>
            Investigators later discovered that the same call appeared
            in the phone records three times.
          </p>

          <p>
            Each recording contained slightly different static patterns.
          </p>

          <p>
            The final recording contained a sound resembling human speech.
            The source of the audio remains unidentified.
          </p>

          <h3>ARCHIVE NOTE</h3>

          <p>
            No known individual has been identified as the caller.
          </p>

          <p>
            Further investigation was suspended after the telephone number
            disappeared from all available records.
          </p>

          <button
            onClick={() => setIncidenteAbierto(null)}
          >
            CLOSE INCIDENT FILE
          </button>

        </div>
      )}

      {/* =====================================================
          INCIDENT #002
      ===================================================== */}

      {incidenteAbierto === 2 && (
        <div className="archivo">

          <h2>INCIDENT #002</h2>

          <p>DESIGNATION: THE MISSING HOUR</p>
          <p>CLASSIFICATION: TEMPORAL ANOMALY</p>
          <p>THREAT LEVEL: MEDIUM</p>
          <p>STATUS: ACTIVE</p>

          <hr />

          <p>DATE RECORDED: 1998</p>
          <p>LOCATION: [REDACTED]</p>
          <p>SUBJECTS: 4 CIVILIANS</p>

          <h3>INCIDENT SUMMARY</h3>

          <p>
            Four individuals reported experiencing an unexplained loss
            of approximately one hour while traveling through an
            isolated rural area.
          </p>

          <p>
            According to their statements, the group was driving at
            approximately 11:40 PM.
          </p>

          <p>
            The next confirmed time recorded by the vehicle's dashboard
            clock was 12:47 AM.
          </p>

          <h3>ANOMALOUS DETAILS</h3>

          <p>
            None of the subjects reported falling asleep or losing
            consciousness during the missing period.
          </p>

          <p>
            The vehicle continued moving normally during the entire
            unexplained interval.
          </p>

          <p>
            Upon inspection, all four watches belonging to the subjects
            were found to be exactly 63 minutes behind.
          </p>

          <p>
            The vehicle's GPS contained no recorded data for the missing
            period.
          </p>

          <h3>FOLLOW-UP</h3>

          <p>
            Investigators attempted to reconstruct the route using
            surrounding traffic cameras.
          </p>

          <p>
            No footage showed the vehicle during the missing hour.
          </p>

          <h3>ARCHIVE NOTE</h3>

          <p>
            The incident remains unexplained.
            Similar reports have since been documented in the same region.
          </p>

          <button
            onClick={() => setIncidenteAbierto(null)}
          >
            CLOSE INCIDENT FILE
          </button>

        </div>
      )}

      {/* =====================================================
          INCIDENT #003
      ===================================================== */}

      {incidenteAbierto === 3 && (
        <div className="archivo">

          <h2>INCIDENT #003</h2>

          <p>DESIGNATION: THE EMPTY CALLER</p>
          <p>CLASSIFICATION: UNCONFIRMED</p>
          <p>THREAT LEVEL: UNKNOWN</p>
          <p>STATUS: OPEN</p>

          <hr />

          <p>DATE RECORDED: 2007</p>
          <p>LOCATION: [REDACTED]</p>
          <p>SUBJECT: UNKNOWN</p>

          <h3>INCIDENT SUMMARY</h3>

          <p>
            Multiple residents reported receiving telephone calls from
            an unidentified number during the early morning hours.
          </p>

          <p>
            When answered, the caller remained completely silent.
            No background noise or identifiable environmental sounds
            were detected.
          </p>

          <p>
            Each call lasted exactly 31 seconds before disconnecting.
          </p>

          <h3>ANOMALOUS DETAILS</h3>

          <p>
            Investigators discovered that the number used to make the
            calls did not belong to any registered telephone line.
          </p>

          <p>
            Attempts to call the number back resulted in immediate
            disconnection.
          </p>

          <p>
            Several recipients reported hearing their own voices
            through the receiver despite never speaking during the call.
          </p>

          <h3>FOLLOW-UP</h3>

          <p>
            One recording recovered from a recipient's device contained
            approximately 31 seconds of silence.
          </p>

          <p>
            Spectral analysis later revealed faint audio patterns
            resembling human speech beneath the recording's noise floor.
          </p>

          <h3>ARCHIVE WARNING</h3>

          <p>
            Personnel are instructed not to answer unidentified calls
            associated with this incident.
          </p>

          <p>
            Attempts to identify the caller have produced no reliable
            results.
          </p>

          <h3>FINAL NOTE</h3>

          <p>
            The origin of the calls remains unknown.
            Investigation is currently suspended.
          </p>

          <button
            onClick={() => setIncidenteAbierto(null)}
          >
            CLOSE INCIDENT FILE
          </button>

        </div>
      )}

      {/* =====================================================
          INCIDENT #004
      ===================================================== */}

      {incidenteAbierto === 4 && (
        <div className="archivo">

          <h2>INCIDENT #004</h2>

          <p>DESIGNATION: █████████████</p>
          <p>CLASSIFICATION: RESTRICTED</p>
          <p>THREAT LEVEL: CRITICAL</p>
          <p>STATUS: ACTIVE</p>

          <hr />

          <p>DATE RECORDED: ███████</p>
          <p>LOCATION: [REDACTED]</p>
          <p>AUTHORIZATION: LEVEL 05</p>

          <h3>INCIDENT SUMMARY</h3>

          <p>
            On ███████, an investigation team was dispatched to a
            restricted location following reports of unexplained
            electronic interference.
          </p>

          <p>
            The team consisted of six personnel.
            Only five returned.
          </p>

          <h3>ANOMALOUS DETAILS</h3>

          <p>
            All communication with the missing personnel ceased
            simultaneously at 03:17 AM.
          </p>

          <p>
            Radio transmissions recovered from the investigation
            contained references to locations that did not exist.
          </p>

          <p>
            Several recordings also contained the voices of personnel
            who were confirmed to be outside the facility at the time.
          </p>

          <p>
            One recovered transmission repeatedly identified the missing
            member as being "already inside."
          </p>

          <h3>RECOVERY OPERATION</h3>

          <p>
            A secondary team was deployed approximately six hours later.
          </p>

          <p>
            The original equipment was recovered.
            No personnel were located.
          </p>

          <p>
            The final radio transmission was recorded at 03:17 AM.
            The timestamp was later determined to be impossible.
          </p>

          <h3>ARCHIVE WARNING</h3>

          <p>
            ACCESS TO THIS FILE REQUIRES LEVEL 05 AUTHORIZATION.
          </p>

          <p>
            DO NOT ATTEMPT TO LOCATE THE MISSING PERSONNEL.
          </p>

          <p>
            DO NOT RESPOND TO ANY TRANSMISSION USING THEIR IDENTITIES.
          </p>

          <h3>FINAL NOTE</h3>

          <p>
            All further documentation concerning INCIDENT #004 has been
            classified.
          </p>

          <p>
            █████████████████████████████████████████
          </p>

          <button
            onClick={() => setIncidenteAbierto(null)}
          >
            CLOSE INCIDENT FILE
          </button>

        </div>
      )}

      {/* =====================================================
          CASE #001
      ===================================================== */}

      {archivoAbierto && (
        <div className="archivo">

          <h2>CASE #001</h2>

          <p>
            Phenomenon recorded: The Empty Room
          </p>

          <p>
            Classification: UNEXPLAINED
          </p>

          <p>
            Threat Level: UNKNOWN
          </p>

          <p>
            Location: [REDACTED]
          </p>

          <p>
            First Recorded: 1987
          </p>

          <h3>INCIDENT REPORT</h3>

          <p>
            At 02:13 AM, an empty room was discovered inside a
            residence that had been abandoned for approximately
            seventeen years.
          </p>

          <p>
            The room contained no furniture, no windows, and no
            visible entrance.
          </p>

          <p>
            Three investigators entered the room separately.
          </p>

          <p>
            All three reported hearing someone whisper their
            names from behind them.
          </p>

          <p>
            No other person was present.
          </p>

          <p>
            The fourth investigator never entered.
          </p>

          <p>
            His name was heard from inside the room anyway.
          </p>

          <p>
            After the investigation was terminated, the room
            was sealed.
          </p>

          <p>
            At 03:17 AM, the sound of knocking was recorded
            from the other side of the wall.
          </p>

          <p>
            There was no room on the other side.
          </p>

          <h3>EVIDENCE</h3>

          <div className="evidence">

            <p>FILE: AUDIO_001.wav</p>
            <p>STATUS: CORRUPTED</p>
            <p>DURATION: 00:17</p>

            <button
              onClick={() => setAudioAbierto(true)}
            >
              PLAY RECORDING
            </button>

          </div>

          <div className="evidence">

            <p>FILE: PHOTO_001.jpeg</p>
            <p>STATUS: RESTRICTED</p>

            <button
              onClick={() => setImagenAbierta(true)}
            >
              VIEW IMAGE
            </button>

          </div>

          {/* AUDIO WARNING */}

          {audioAbierto && (
            <>
              <div className="screen-overlay"></div>

              <div className="audio-warning">

                <h3>WARNING</h3>

                <p>
                  AUDIO FILE CONTAINS UNVERIFIED MATERIAL.
                </p>

                <p>
                  LISTENING MAY CAUSE DISORIENTATION.
                </p>

                <button
                  onClick={() => setAudioAbierto(false)}
                >
                  CANCEL
                </button>

                <button
                  onClick={() => {
                    setAudioAbierto(false)
                    setAudioReproduciendo(true)
                  }}
                >
                  CONTINUE
                </button>

              </div>
            </>
          )}

          {/* IMAGE VIEWER */}

          {imagenAbierta && (
            <>
              <div className="screen-overlay"></div>

              <div className="image-viewer">

                <h3>PHOTO EVIDENCE</h3>

                <p>FILE: PHOTO_001.jpeg</p>
                <p>STATUS: RESTRICTED</p>

                <img
                  src="/PHOTO_001.jpeg"
                  alt="Classified evidence"
                />

                <button
                  onClick={() => setImagenAbierta(false)}
                >
                  CLOSE EVIDENCE
                </button>

              </div>
            </>
          )}

          {/* AUDIO PLAYER */}

          {audioReproduciendo && (
            <>
              <div className="screen-overlay"></div>

              <div className="audio-player">

                <h3>PLAYBACK ACTIVE</h3>

                <p>FILE: AUDIO_001.wav</p>
                <p>STATUS: PLAYING</p>
                <p>DURATION: 00:17</p>

                <div className="audio-progress">
                  ████████████░░░░░░░░
                </div>

                <p className="audio-text">
                  [ AUDIO SIGNAL DETECTED ]
                </p>

                <p className="audio-text glitch-text">
                  [ UNKNOWN VOICE PRESENT ]
                </p>

                <button
                  onClick={() => setAudioReproduciendo(false)}
                >
                  STOP PLAYBACK
                </button>

              </div>
            </>
          )}

          <button
            onClick={() => setArchivoAbierto(false)}
          >
            CLOSE ARCHIVE
          </button>

        </div>
      )}

    </div>
  )
}

export default App