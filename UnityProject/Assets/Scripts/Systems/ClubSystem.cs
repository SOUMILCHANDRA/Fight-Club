using UnityEngine;
using System.Collections.Generic;

namespace ProjectMayhem.Systems
{
    [System.Serializable]
    public class ClubMember
    {
        public string Name;
        public float Loyalty;
        public float Instability;
    }

    public class ClubSystem : MonoBehaviour
    {
        public List<ClubMember> Members = new List<ClubMember>();
        public float Reputation = 0;
        public float PoliceAttention = 0;

        private string[] _namePool = { "Jack", "Tyler", "Marla", "Cornelius", "Rupert", "Angel Face" };

        public bool Recruit()
        {
            if (Members.Count < 10)
            {
                string name = _namePool[Random.Range(0, _namePool.Length)];
                ClubMember newMember = new ClubMember
                {
                    Name = name,
                    Loyalty = Random.Range(50f, 100f),
                    Instability = Random.Range(0f, 100f)
                };
                Members.Add(newMember);
                Reputation += 10;
                Debug.Log($"NEW RECRUIT: {name}. Welcome to Project Mayhem.");
                return true;
            }
            return false;
        }

        public void IncreasePoliceAttention(float amount)
        {
            PoliceAttention += amount;
            if (PoliceAttention > 100) PoliceAttention = 100;
        }
    }
}
