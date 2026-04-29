#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using ProjectMayhem.Systems;

namespace ProjectMayhem.Editor
{
    [InitializeOnLoad]
    public class EditorSetupAutoRun
    {
        static EditorSetupAutoRun()
        {
            EditorApplication.delayCall += CheckAndSetupScene;
        }

        private static void CheckAndSetupScene()
        {
            // Only run if the scene is empty and it's the "Untitled" scene
            if (GameObject.FindWithTag("Player") == null && SceneManager.GetActiveScene().name == "")
            {
                Debug.Log("PROJECT MAYHEM: Auto-initializing empty scene...");
                
                GameObject setupObj = new GameObject("PROJECT_MAYHEM_SETUP");
                var setup = setupObj.AddComponent<ProjectMayhemOneClickSetup>();
                
                // Force run the setup
                setup.PerformFullSetup();
                
                // Save the scene
                EditorSceneManager.SaveScene(SceneManager.GetActiveScene(), "Assets/Scenes/MainArena.unity");
            }
        }
    }
}
#endif
