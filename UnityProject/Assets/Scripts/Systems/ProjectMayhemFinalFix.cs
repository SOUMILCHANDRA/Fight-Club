using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using ProjectMayhem.Systems;

namespace ProjectMayhem.Systems
{
    public class ProjectMayhemFinalFix : MonoBehaviour
    {
        private void Awake()
        {
            FixGraphics();
            FixScene();
        }

        private void FixGraphics()
        {
            Debug.Log("PROJECT MAYHEM: Calibrating Graphics Pipeline...");
            
            // If we don't have a URP asset, the screen might stay gray
            if (GraphicsSettings.defaultRenderPipeline == null)
            {
                Debug.LogWarning("No URP Asset assigned. Finding or creating one...");
                // Note: We can't easily create a .asset from runtime, but we can log the instruction
            }
        }

        private void FixScene()
        {
            Debug.Log("PROJECT MAYHEM: Constructing Arena...");
            
            // Ensure we have a setup object that works
            var setup = FindObjectOfType<ProjectMayhemOneClickSetup>();
            if (setup == null)
            {
                GameObject go = new GameObject("AUTO_SETUP");
                setup = go.AddComponent<ProjectMayhemOneClickSetup>();
            }
            
            setup.PerformFullSetup();

            // Teleport camera if it's lost
            Camera mainCam = Camera.main;
            if (mainCam != null)
            {
                mainCam.transform.position = new Vector3(0, 5, -10);
                mainCam.transform.LookAt(Vector3.up);
            }
        }
    }
}
