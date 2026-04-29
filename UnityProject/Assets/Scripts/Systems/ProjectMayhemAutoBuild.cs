using UnityEngine;
using ProjectMayhem.Systems;

namespace ProjectMayhem.Systems
{
    public class ProjectMayhemAutoBuild
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void AutoCreateSetup()
        {
            if (Object.FindObjectOfType<ProjectMayhemOneClickSetup>() == null)
            {
                Debug.Log("PROJECT MAYHEM: Creating missing Setup Object...");
                GameObject setupObj = new GameObject("PROJECT_MAYHEM_AUTO_SETUP");
                setupObj.AddComponent<ProjectMayhemOneClickSetup>();
            }
        }
    }
}
