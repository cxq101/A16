using Godot;
namespace A16;
public static class Room {
    public static StandardMaterial3D Material(string color,float rough=.75f,float metallic=0)=>new(){AlbedoColor=new Color(color),Roughness=rough,Metallic=metallic};
    public static ShaderMaterial Wood(string color) {
        var shader=new Shader{Code=@"shader_type spatial;
        uniform vec4 base_color : source_color;
        varying vec3 p;
        void vertex(){p=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;}
        void fragment(){float grain=sin(p.x*65.0+sin(p.z*4.0)*2.0+sin(p.z*13.0));float fine=sin(p.x*187.0+p.z*2.0);ALBEDO=base_color.rgb*(.91+grain*.055+fine*.02);ROUGHNESS=.73;}"};
        var material=new ShaderMaterial{Shader=shader};material.SetShaderParameter("base_color",new Color(color));return material;
    }
    public static MeshInstance3D Box(Node3D root,Vector3 position,Vector3 size,Material material,bool solid=false) {
        var mesh=new MeshInstance3D{Position=position,Mesh=new BoxMesh{Size=size},MaterialOverride=material};root.AddChild(mesh);
        if(solid){
            // Keep the visible top unchanged, but give thin support surfaces depth below it.
            float depth=Mathf.Max(size.Y,.12f);
            var body=new StaticBody3D{Position=position-Vector3.Up*((depth-size.Y)/2),CollisionLayer=1};
            body.AddChild(new CollisionShape3D{Shape=new BoxShape3D{Size=new(size.X,depth,size.Z)}});root.AddChild(body);
        }
        return mesh;
    }
    public static void Label(Node3D root,string text,Vector3 p,int size=40,Color? color=null) {
        var label=new Label3D{Text=text,Position=p,FontSize=size,PixelSize=.0025f,Modulate=color??new Color("e2d3b0"),OutlineSize=0,Billboard=BaseMaterial3D.BillboardModeEnum.Disabled};
        label.Font=new SystemFont{FontNames=new string[]{"Microsoft YaHei"}};label.RotationDegrees=new(-90,0,0);root.AddChild(label);
    }
    // Highest visible support touched by a loose card, including tabs and in-plane rotation.
    public static float DeskSurface(Vector3 p,Vector2 size,float yaw,Vector2[] footprint=null) {
        float c=Mathf.Abs(Mathf.Cos(yaw)),s=Mathf.Abs(Mathf.Sin(yaw));
        float hx=c*(size.X/2+.073f)+s*(size.Y/2+.073f),hz=s*(size.X/2+.073f)+c*(size.Y/2+.073f);
        bool Touch(float x,float z,float w,float h) {
            if(footprint==null)return Mathf.Abs(p.X-x)<w/2+hx&&Mathf.Abs(p.Z-z)<h/2+hz;
            return Geometry2D.IntersectPolygons(footprint,new[]{new Vector2(x-w/2,z-h/2),new(x+w/2,z-h/2),new(x+w/2,z+h/2),new(x-w/2,z+h/2)}).Count>0;
        }
        float top=Touch(0,-2.5f,6.8f,2.8f)?1.055f:0;
        if(Touch(0,-2.5f,6.65f,2.66f))top=1.0725f;
        foreach(float x in new[]{-2.1f,0f,2.1f}) {
            if(Touch(x,-2.6f,1.7f,1.9f))top=Mathf.Max(top,1.092f);
            if(Touch(x,-3.53f,1.68f,.018f))top=Mathf.Max(top,1.104f);
        }
        if(Touch(2.1f,-2.6f,1.7f,1.82f))top=Mathf.Max(top,1.18f);
        for(int col=0;col<3;col++)for(int row=0;row<3;row++)
            if(Touch(1.57f+col*.53f,-3.12f+row*.52f,.37f,.49f))top=Mathf.Max(top,1.194f);
        return top;
    }
    public static void Build(Node3D root) {
        var wood=Wood("604d3b");StandardMaterial3D dark=Material("263c3c"),wall=Material("74807a"),gold=Material("b39255",.32f,.7f),cream=Material("d6cfbb");
        Box(root,new(0,-.12f,0),new(12,.2f,11),wood,true);
        for(int i=0;i<28;i++){float x=-5.9f+i*.44f;Box(root,new(x,-.012f,0),new(.009f,.005f,11),Material("342d27"));}
        Box(root,new(0,2.5f,-5.25f),new(12,5,.2f),wall,true);Box(root,new(-5.95f,2.5f,0),new(.2f,5,11),wall,true);Box(root,new(5.95f,2.5f,0),new(.2f,5,11),wall,true);Box(root,new(0,2.5f,5.4f),new(12,5,.2f),wall,true);
        Box(root,new(0,.45f,-5.1f),new(11.8f,.85f,.08f),dark);Box(root,new(0,.9f,-5.06f),new(11.8f,.045f,.06f),gold);
        for(int side=-1;side<=1;side+=2) {
            float x=side*4.5f;Box(root,new(x,1.7f,-4.8f),new(2.1f,3.4f,.65f),dark,true);
            for(int k=0;k<5;k++) {
                Box(root,new(x,.3f+k*.67f,-4.35f),new(2.05f,.055f,.9f),wood);
                for(int b=0;b<7;b++)Box(root,new(x-.8f+b*.24f,.57f+k*.67f,-4.54f),new(.15f,.46f,.32f),Material(b%3==0?"a17e51":b%3==1?"476764":"7d6964"));
            }
        }
        // Reading window, wall trim and warm practical lights.
        Box(root,new(0,2.75f,-5.08f),new(4.3f,2.7f,.08f),wood);
        Box(root,new(0,2.75f,-5.0f),new(4.05f,2.45f,.035f),Material("9fcac4",.4f));
        for(int x=-1;x<=1;x++)Box(root,new(x*1.35f,2.75f,-4.94f),new(.06f,2.5f,.05f),cream);
        Box(root,new(0,2.7f,-4.93f),new(4.1f,.06f,.05f),cream);
        Box(root,new(0,.98f,-2.5f),new(6.8f,.15f,2.8f),wood,true);
        Box(root,new(0,1.065f,-2.5f),new(6.65f,.015f,2.66f),Wood("70543c"),true);
        foreach(float x in new[]{-2.9f,2.9f})foreach(float z in new[]{-3.55f,-1.5f})Box(root,new(x,.45f,z),new(.16f,.9f,.16f),dark,true);
        foreach(float x in new[]{-2.1f,0f,2.1f}) {
            Box(root,new(x,1.082f,-2.6f),new(1.7f,.02f,1.9f),Material(x==0?"254c48":"294746"),true);
            Box(root,new(x,1.098f,-3.53f),new(1.68f,.012f,.018f),gold);
        }
        Label(root,"清理区",new(-2.1f,1.1f,-3.65f));Label(root,"拼接区",new(0,1.1f,-3.65f));Label(root,"收卡设备",new(2.1f,1.1f,-3.65f));
        // Physical binder housing; slots/page content are dynamic.
        Box(root,new(2.1f,1.14f,-2.6f),new(1.7f,.08f,1.82f),Material("142e30",.45f,.15f),true);
        for(int c=0;c<3;c++)for(int r=0;r<3;r++)Box(root,new(1.57f+c*.53f,1.19f,-3.12f+r*.52f),new(.37f,.008f,.49f),Material("365351"),true);
        // Container dock and rug.
        Box(root,new(-4.1f,.05f,-2.1f),new(1.1f,.08f,1.5f),Material("314b48"));
        Box(root,new(-4.1f,.25f,-2.1f),new(1.0f,.38f,1.3f),Material("7e6749"),true);
        Box(root,new(-4.1f,.46f,-2.1f),new(.86f,.025f,1.15f),Material("283b38"));
        Box(root,new(0,.006f,1.25f),new(5,.015f,3.1f),Material("586c65"),true);
        for(int i=0;i<9;i++)Box(root,new(-2.4f+i*.6f,.017f,1.25f),new(.012f,.005f,3),Material("b0a47e"));
        var sun=new DirectionalLight3D{RotationDegrees=new(-49,-28,0),LightColor=new Color("ffe1ae"),LightEnergy=.62f,ShadowEnabled=true};root.AddChild(sun);
        root.AddChild(new OmniLight3D{Position=new(-2.7f,3,-1),LightColor=new Color("ffd5a2"),LightEnergy=.7f,OmniRange=8,ShadowEnabled=false});
        root.AddChild(new OmniLight3D{Position=new(3.6f,2.4f,1.7f),LightColor=new Color("c2e6e0"),LightEnergy=.55f,OmniRange=7});
        root.AddChild(new WorldEnvironment{Environment=new Godot.Environment{BackgroundMode=Godot.Environment.BGMode.Color,BackgroundColor=new Color("617d7a"),AmbientLightSource=Godot.Environment.AmbientSource.Color,AmbientLightColor=new Color("cdd7c7"),AmbientLightEnergy=.30f,TonemapMode=Godot.Environment.ToneMapper.Filmic}});
    }
}
