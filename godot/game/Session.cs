using Godot;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using Studio.Foundation;
namespace A16;

public sealed class ItemState {
    public string Id { get; set; } = "";
    public int Card { get; set; }
    public int Piece { get; set; } = -1;
    public string Place { get; set; } = "floor";
    public bool Front { get; set; } = true;
    public bool Dirty { get; set; }
    public string CleanMask { get; set; } = "";
    public float[] Position { get; set; } = new float[3];
    public float[] Rotation { get; set; } = new float[3];
}
public sealed record StudySnapshot : IStoredSnapshot {
    public int Schema { get; set; } = 1;
    public long Revision { get; set; }
    [JsonIgnore] public string WriteToken { get; set; }
    public List<ItemState> Items { get; set; } = new();
    public List<int> Archived { get; set; } = new();
    public float[] Player { get; set; } = new float[] {0, .92f, 3.6f};
    public float Yaw { get; set; }
    public float Pitch { get; set; } = -.24f;
    public int Target { get; set; } = 2;
    public int Page { get; set; }
}
public sealed class StudyCodec : ISaveCodec<StudySnapshot> {
    public StorageInspection<StudySnapshot> Decode(byte[] bytes) {
        try {
            var s=JsonSerializer.Deserialize<StudySnapshot>(bytes);
            if (s==null) return new(SaveStatus.Corrupt,null,"Empty snapshot");
            if (s.Schema>1) return new(SaveStatus.FutureVersion,null,"Newer study version");
            string[] places={"floor","desk","container","held","clean","puzzle","assembled","archived"};
            bool valid=s.Schema==1 && s.Revision>=0 && s.Items!=null && s.Archived!=null && s.Items.Count is >=8 and <=9
                && s.Items.Select(i=>i.Id).Distinct().Count()==s.Items.Count
                && s.Items.All(i=>i.Card is >=0 and <3 && i.Piece is >=-1 and <6 && places.Contains(i.Place)
                    && i.Position?.Length==3 && i.Rotation?.Length==3 && i.Position.All(float.IsFinite) && i.Rotation.All(float.IsFinite))
                && s.Archived.Distinct().Count()==s.Archived.Count && s.Archived.All(c=>c is >=0 and <3)
                && s.Player?.Length==3 && s.Player.All(float.IsFinite) && float.IsFinite(s.Yaw) && float.IsFinite(s.Pitch)
                && s.Target is >=0 and <3 && s.Page is >=0 and <3;
            return valid?new(SaveStatus.Ready,s,""):new(SaveStatus.Corrupt,null,"Invalid study payload");
        } catch (JsonException e) { return new(SaveStatus.Corrupt,null,e.Message); }
    }
    public byte[] Encode(StudySnapshot s)=>JsonSerializer.SerializeToUtf8Bytes(s);
    public byte[] PrepareRestore(byte[] bytes,StudySnapshot s,bool legacy)=>Encode(s);
    public StudySnapshot WithWriteToken(StudySnapshot s,string token)=>s with {WriteToken=token};
}
// Domain rules live here. BaX owns file installation, revision tokens and backups.
public sealed class Session {
    public static readonly string[] Names={"听潮幼鲸","逐月灵鲸","月潮之鲸"};
    public static readonly string[] Art={"common","rare","legendary"};
    public StudySnapshot Data { get; private set; }
    public int Capacity=>Data.Archived.Count>=2?18:12;
    public int Carried=>Data.Items.Count(i=>i.Place=="container");
    public Session(int seed=73) { Reset(seed); }
    public void Reset(int seed) {
        Data=new(); var rng=new Random(seed);
        for(int c=0;c<3;c++) for(int p=0;p<(c==2?6:1);p++) {
            var i=new ItemState {Id=$"{c}:{(c==2?p:-1)}",Card=c,Piece=c==2?p:-1,Dirty=c==1 || c==2&&p%2==0,
                Front=rng.Next(2)==0,Position=new[]{(float)(rng.NextDouble()*7-3.5),.18f,(float)(rng.NextDouble()*2.5-.2)}};
            if(c==0) i.Position=new[]{-.5f,.2f,1.7f};
            Data.Items.Add(i);
        }
    }
    public void Restore(StudySnapshot data)=>Data=data;
    public bool Collect(ItemState i) {
        if(Carried>=Capacity || i.Place is not ("floor" or "desk"))return false;
        i.Place="container";return true;
    }
    public bool CanArchive(ItemState i,out string why) {
        why=i.Piece>=0?"请先把碎片拼成完整卡":!i.Front?"请先将卡牌翻到正面":i.Dirty?"请先清理卡面污渍":Data.Archived.Contains(i.Card)?"这张卡已经归档":"";
        return why.Length==0;
    }
    public bool Archive(ItemState i,out string why) {
        if(!CanArchive(i,out why))return false;
        Data.Archived.Add(i.Card);i.Place="archived";return true;
    }
    public bool PlacePiece(ItemState i,int target,int slot,out bool assembled) {
        assembled=false;
        if(i.Piece<0 || i.Card!=target || i.Piece!=slot || !i.Front || i.Dirty || i.Place is "puzzle" or "assembled" or "archived")return false;
        i.Place="puzzle";
        var pieces=Data.Items.Where(s=>s.Card==target&&s.Piece>=0).ToArray();
        if(pieces.Length==6 && pieces.All(s=>s.Place=="puzzle")) {
            foreach(var piece in pieces)piece.Place="assembled";
            Data.Items.Add(new ItemState {Id=$"{target}:whole",Card=target,Place="desk",Position=new[]{0f,1.10f,-2.5f}});
            assembled=true;
        }
        return true;
    }
    public void Save(SingleSaveFile<StudySnapshot> store) {
        Data=store.Save(revision=>Data with {Revision=revision},Data.Revision,Data.WriteToken);
    }
    public static void Smoke() {
        void Check(bool condition,string message){if(!condition)throw new Exception(message);}
        var s=new Session();Check(s.Data.Items.Count==8,"sample item count");
        var dirty=s.Data.Items.Single(i=>i.Card==1);dirty.Front=true;
        Check(!s.Archive(dirty,out _),"dirty card rejected");dirty.Dirty=false;dirty.Front=false;
        Check(!s.Archive(dirty,out _),"back-facing card rejected");dirty.Front=true;
        Check(s.Archive(dirty,out _)&&!s.Archive(dirty,out _),"archive exactly once");
        foreach(var piece in s.Data.Items.Where(i=>i.Card==2).ToArray()) {
            piece.Front=true;piece.Dirty=false;
            Check(!s.PlacePiece(piece,0,piece.Piece,out _),"wrong target rejected");
            Check(s.PlacePiece(piece,2,piece.Piece,out _),"correct piece accepted");
            Check(!s.PlacePiece(piece,2,piece.Piece,out _),"placed piece fixed");
        }
        Check(s.Data.Items.Count(i=>i.Card==2&&i.Piece==-1)==1,"one assembled card");
        Check(s.Archive(s.Data.Items.Single(i=>i.Card==2&&i.Piece==-1),out _),"assembled archive");
        Check(s.Capacity==18,"capacity unlock");
        var dir=System.IO.Path.Combine(System.IO.Path.GetTempPath(),"a16-smoke-"+Guid.NewGuid());
        var store=new SingleSaveFile<StudySnapshot>(System.IO.Path.Combine(dir,"save.json"),new StudyCodec());
        s.Save(store);var read=store.Inspect();
        Check(read.CanContinue&&read.Snapshot.Archived.Count==2&&read.Snapshot.Items.Count==9,"save roundtrip");
        Check(read.Snapshot.WriteToken==s.Data.WriteToken,"save generation token");
        GD.Print("PASS: domain guards, fixed pieces, unique assembly, archive count, capacity and isolated BaX save roundtrip");
    }
}
