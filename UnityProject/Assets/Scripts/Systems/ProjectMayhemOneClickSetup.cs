using UnityEngine;
using UnityEngine.UI;
using TMPro;
using ProjectMayhem.Player;
using ProjectMayhem.Systems;
using ProjectMayhem.Combat;
using ProjectMayhem.UI;
using ProjectMayhem.Visuals;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace ProjectMayhem.Systems
{
    [ExecuteInEditMode]
    public class ProjectMayhemOneClickSetup : MonoBehaviour
    {
        public bool RunSetup = false;

        private void Awake()
        {
            if (Application.isPlaying)
            {
                PerformFullSetup();
            }
        }

        private void Update()
        {
            if (RunSetup)
            {
                RunSetup = false;
                PerformFullSetup();
            }
        }

        public void PerformFullSetup()
        {
            Debug.Log("PROJECT MAYHEM: Starting Full System Setup...");

            SetupEnvironment();
            GameObject player = SetupPlayer();
            SetupManagers(player);
            SetupUI(player);
            SetupPostProcessing();

            Debug.Log("PROJECT MAYHEM: Setup Complete. Welcome to the Club.");
        }

        private void SetupEnvironment()
        {
            if (GameObject.Find("ArenaFloor")) return;

            GameObject floor = GameObject.CreatePrimitive(PrimitiveType.Plane);
            floor.name = "ArenaFloor";
            floor.transform.localScale = new Vector3(5, 1, 5);
            
            Renderer rend = floor.GetComponent<Renderer>();
            Material floorMat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
            if (floorMat.shader == null) floorMat.shader = Shader.Find("Standard");
            
            floorMat.color = Color.white; // Bright white for visibility
            rend.sharedMaterial = floorMat;
            
            GameObject lightObj = new GameObject("NoirLight");
            Light light = lightObj.AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 1.5f;
            light.color = new Color(0.8f, 0.9f, 1f); // Cold light
            lightObj.transform.rotation = Quaternion.Euler(50, -30, 0);
        }

        private GameObject SetupPlayer()
        {
            GameObject player = GameObject.FindWithTag("Player");
            if (player != null) return player;

            player = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            player.name = "ProjectMayhem_Player";
            player.tag = "Player";
            player.transform.position = new Vector3(0, 1, 0);

            Rigidbody rb = player.AddComponent<Rigidbody>();
            rb.constraints = RigidbodyConstraints.FreezeRotationX | RigidbodyConstraints.FreezeRotationZ;

            player.AddComponent<SanitySystem>();
            player.AddComponent<PersonalityManager>();
            player.AddComponent<PlayerController>();

            // Setup Camera
            Camera mainCam = Camera.main;
            if (mainCam != null)
            {
                mainCam.transform.position = new Vector3(0, 5, -10);
                mainCam.transform.rotation = Quaternion.Euler(20, 0, 0);
                
                if (!mainCam.GetComponent<CameraFollow>())
                {
                    var follow = mainCam.gameObject.AddComponent<CameraFollow>();
                    follow.Target = player.transform;
                }
            }

            return player;
        }

        private void SetupManagers(GameObject player)
        {
            GameObject managers = GameObject.Find("GlobalManagers");
            if (managers != null) return;

            managers = new GameObject("GlobalManagers");
            managers.AddComponent<CombatManager>();
            managers.AddComponent<GameManager>();
            managers.AddComponent<ClubSystem>();
            managers.AddComponent<MissionSystem>();
        }

        private void SetupUI(GameObject player)
        {
            if (GameObject.Find("ProjectMayhem_Canvas")) return;

            GameObject canvasObj = new GameObject("ProjectMayhem_Canvas");
            Canvas canvas = canvasObj.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvasObj.AddComponent<CanvasScaler>();
            canvasObj.AddComponent<GraphicRaycaster>();

            // Create HUD Panel
            GameObject hud = new GameObject("HUD");
            hud.transform.SetParent(canvasObj.transform);
            RectTransform hudRect = hud.AddComponent<RectTransform>();
            hudRect.anchorMin = new Vector2(0, 1);
            hudRect.anchorMax = new Vector2(0, 1);
            hudRect.pivot = new Vector2(0, 1);
            hudRect.anchoredPosition = new Vector2(20, -20);
            hudRect.sizeDelta = new Vector2(300, 200);

            // Add Text Elements
            UIManager uiManager = canvasObj.AddComponent<UIManager>();
            uiManager.SanityText = CreateTextElement(hud.transform, "SanityText", "STABILITY: STABLE", new Vector2(0, 0));
            uiManager.PersonalityText = CreateTextElement(hud.transform, "PersonalityText", "MODE: NARRATOR", new Vector2(0, -30));
            uiManager.StaminaText = CreateTextElement(hud.transform, "StaminaText", "VITALITY: 100%", new Vector2(0, -60));
            uiManager.ReputationText = CreateTextElement(hud.transform, "ReputationText", "REPUTATION: 0", new Vector2(0, -90));
            uiManager.HeatText = CreateTextElement(hud.transform, "HeatText", "POLICE HEAT: 0%", new Vector2(0, -120));
        }

        private TextMeshProUGUI CreateTextElement(Transform parent, string name, string initialText, Vector2 pos)
        {
            GameObject textObj = new GameObject(name);
            textObj.transform.SetParent(parent);
            RectTransform rect = textObj.AddComponent<RectTransform>();
            rect.anchoredPosition = pos;
            rect.sizeDelta = new Vector2(300, 30);
            
            TextMeshProUGUI tmp = textObj.AddComponent<TextMeshProUGUI>();
            tmp.text = initialText;
            tmp.fontSize = 24;
            tmp.color = Color.white;
            return tmp;
        }

        private void SetupPostProcessing()
        {
            if (GameObject.Find("GlobalPostProcess")) return;

            GameObject volumeObj = new GameObject("GlobalPostProcess");
            Volume volume = volumeObj.AddComponent<Volume>();
            volume.isGlobal = true;
            
            // Note: We'd ideally create a profile here, but creating a new profile file via script is complex.
            // For now, we'll just add the manager.
            volumeObj.AddComponent<VisualEffectManager>();
        }
    }
}
