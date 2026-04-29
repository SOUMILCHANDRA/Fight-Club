using UnityEngine;
using ProjectMayhem.Player;
using ProjectMayhem.Systems;
using ProjectMayhem.Combat;
using ProjectMayhem.UI;
using ProjectMayhem.Visuals;
using UnityEngine.Rendering;

namespace ProjectMayhem.Systems
{
    public class SceneInitializer : MonoBehaviour
    {
        [Header("Prefabs & Assets")]
        public GameObject PlayerPrefab;
        public GameObject EnemyPrefab;
        public GameObject SoapPrefab;
        public VolumeProfile PostProcessProfile;

        private void Start()
        {
            SetupEnvironment();
            SetupPlayer();
            SetupSystems();
        }

        private void SetupEnvironment()
        {
            // Floor
            GameObject floor = GameObject.CreatePrimitive(PrimitiveType.Plane);
            floor.name = "ArenaFloor";
            floor.transform.localScale = new Vector3(10, 1, 10);
            floor.GetComponent<Renderer>().material.color = new Color(0.2f, 0.2f, 0.2f);
            floor.layer = LayerMask.NameToLayer("Default");

            // Lighting
            GameObject lightObj = new GameObject("MainLight");
            Light light = lightObj.AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 1.0f;
            lightObj.transform.rotation = Quaternion.Euler(50, -30, 0);
        }

        private void SetupPlayer()
        {
            GameObject player;
            if (PlayerPrefab != null)
            {
                player = Instantiate(PlayerPrefab, new Vector3(0, 1, 0), Quaternion.identity);
            }
            else
            {
                // Fallback player
                player = GameObject.CreatePrimitive(PrimitiveType.Capsule);
                player.name = "Player";
                player.transform.position = new Vector3(0, 1, 0);
                player.AddComponent<Rigidbody>();
                player.AddComponent<SanitySystem>();
                player.AddComponent<PersonalityManager>();
                player.AddComponent<PlayerController>();
                player.tag = "Player";
            }

            // Camera Setup
            Camera mainCam = Camera.main;
            if (mainCam != null)
            {
                var follow = mainCam.gameObject.AddComponent<CameraFollow>();
                follow.Target = player.transform;
            }
        }

        private void SetupSystems()
        {
            // Global Managers
            GameObject managers = new GameObject("Managers");
            managers.AddComponent<CombatManager>();
            managers.AddComponent<GameManager>();
            managers.AddComponent<ClubSystem>();
            managers.AddComponent<MissionSystem>();
            
            // Visuals
            GameObject volumeObj = new GameObject("PostProcessVolume");
            Volume volume = volumeObj.AddComponent<Volume>();
            volume.isGlobal = true;
            volume.profile = PostProcessProfile;
            volumeObj.AddComponent<VisualEffectManager>();
        }
    }
}
