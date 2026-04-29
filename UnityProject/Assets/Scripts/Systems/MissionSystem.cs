using UnityEngine;

namespace ProjectMayhem.Systems
{
    public enum MissionType
    {
        STEALTH,
        CHAOS
    }

    [System.Serializable]
    public class Mission
    {
        public MissionType Type;
        public float Timer;
        public int Targets;
        public int Progress;
    }

    public class MissionSystem : MonoBehaviour
    {
        public Mission ActiveMission;

        public void StartMission(MissionType type)
        {
            ActiveMission = new Mission
            {
                Type = type,
                Timer = (type == MissionType.STEALTH) ? 60f : 30f,
                Targets = 5,
                Progress = 0
            };
            Debug.Log($"MISSION STARTED: {type}. Failure is not an option.");
        }

        private void Update()
        {
            if (ActiveMission == null) return;

            ActiveMission.Timer -= Time.deltaTime;
            if (ActiveMission.Timer <= 0)
            {
                Debug.Log("MISSION FAILED: Reality reasserts itself.");
                ActiveMission = null;
            }
        }

        public void RegisterProgress()
        {
            if (ActiveMission == null) return;

            ActiveMission.Progress++;
            if (ActiveMission.Progress >= ActiveMission.Targets)
            {
                Debug.Log("MISSION ACCOMPLISHED: The seeds of chaos have been sown.");
                ActiveMission = null;
            }
        }
    }
}
